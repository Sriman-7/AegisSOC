/**
 * AegisSOC Real-Time Anomaly Detection & False-Positive Reduction Engine
 * Strictly implements the multi-factor mathematical scoring and contextual baseline formulas.
 */

export interface StructuredReason {
  feature: string;
  observed: string | number;
  baseline: string | number;
  contribution: number; // 0..1
  description: string;
}

export interface DetectionResult {
  anomalyScore: number;       // 0..1
  zNorm: number;              // 0..1
  entropyDrift: number;       // 0..1
  sequenceRisk: number;       // 0..1
  intelMatch: number;         // 0..1
  contextMultiplier: number;
  confidence: number;         // 0..1
  severityBand: "BENIGN" | "MEDIUM" | "HIGH" | "CRITICAL";
  isAnomaly: boolean;
  isBenign: boolean;
  reasons: StructuredReason[];
  rawZScore: number;
  currentEntropy: number;
}

export interface TelemetryInput {
  entityId: string;
  sourceType: "NETWORK" | "SYSTEM" | "AUTH" | "ALERT";
  sourceIp?: string;
  destIp?: string;
  port?: number;
  protocol?: string;
  username?: string;
  hostname?: string;
  processName?: string;
  action: string;
  bytesOut?: number;
  dnsQuery?: string;
  payloadSnippet?: string;
  timestamp?: Date;
  assetCriticality?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  isOffHours?: boolean;
  isServiceAccountOrScheduled?: boolean;
  isHistoricalProfileMatch?: boolean;
  isWhitelisted?: boolean;
  sequenceContext?: string[];
}

export interface EntityBaseline {
  bytesOut: number[];
  connectionRate: number[];
  failedLogins: number[];
  distinctPorts: number[];
  dnsEntropy: number[];
}

// In-memory per-entity baseline tracker (can be seeded or dynamically updated)
const baselineStore = new Map<string, EntityBaseline>();

export function getOrCreateBaseline(entityId: string): EntityBaseline {
  if (!baselineStore.has(entityId)) {
    baselineStore.set(entityId, {
      bytesOut: [1800, 2400, 1950, 3100, 2200, 2600, 2100],
      connectionRate: [12, 15, 10, 18, 14, 11, 16],
      failedLogins: [0, 1, 0, 0, 2, 0, 1],
      distinctPorts: [3, 4, 3, 5, 4, 3, 4],
      dnsEntropy: [2.1, 2.3, 2.0, 2.4, 2.2, 2.1, 2.3],
    });
  }
  return baselineStore.get(entityId)!;
}

export function updateBaseline(entityId: string, bytes: number, ports: number, failed: number, entropy: number) {
  const b = getOrCreateBaseline(entityId);
  b.bytesOut.push(bytes);
  if (b.bytesOut.length > 30) b.bytesOut.shift();
  b.distinctPorts.push(ports);
  if (b.distinctPorts.length > 30) b.distinctPorts.shift();
  b.failedLogins.push(failed);
  if (b.failedLogins.length > 30) b.failedLogins.shift();
  b.dnsEntropy.push(entropy);
  if (b.dnsEntropy.length > 30) b.dnsEntropy.shift();
}

/**
 * Computes Shannon Entropy of string
 */
export function calculateShannonEntropy(data: string): number {
  if (!data || data.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of data) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = data.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(3));
}

/**
 * Computes mean and standard deviation
 */
function getStats(values: number[]): { mean: number; stdDev: number } {
  if (!values.length) return { mean: 0, stdDev: 1 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (values.length === 1) return { mean, stdDev: 1 };
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return { mean, stdDev: Math.sqrt(variance) || 1 };
}

/**
 * Calculates statistical Z-score
 */
export function calculateZScore(value: number, history: number[]): number {
  if (!history || history.length === 0) return 0;
  const stats = getStats(history);
  if (stats.stdDev === 0) return 0;
  return parseFloat(((value - stats.mean) / stats.stdDev).toFixed(2));
}

/**
 * Core Scoring Formula as mandated:
 * anomaly_score = 0.35*z_norm + 0.20*entropy_drift + 0.25*sequence_risk + 0.20*intel_match
 */
export function evaluateTelemetry(
  input: TelemetryInput,
  weights: { wZ: number; wEntropy: number; wSeq: number; wIntel: number } = {
    wZ: 0.35,
    wEntropy: 0.20,
    wSeq: 0.25,
    wIntel: 0.20,
  },
  suppressionFactor = 1.0,
  thresholdBands = { medium: 0.35, high: 0.55, critical: 0.80 }
): DetectionResult {
  const reasons: StructuredReason[] = [];
  const baseline = getOrCreateBaseline(input.entityId);

  // 1. Z-Score normalization
  const observedBytes = input.bytesOut ?? 2200;
  const byteStats = getStats(baseline.bytesOut);
  const rawZ = (observedBytes - byteStats.mean) / byteStats.stdDev;
  // Normalize 0..4 sigma to 0..1
  const zNorm = Math.min(Math.max(rawZ / 4.0, 0), 1);
  if (zNorm > 0.3) {
    reasons.push({
      feature: "Egress Volume Z-Score",
      observed: `${observedBytes.toLocaleString()} bytes (z = +${rawZ.toFixed(2)})`,
      baseline: `Mean ${Math.round(byteStats.mean)} bytes (std: ${Math.round(byteStats.stdDev)})`,
      contribution: parseFloat((zNorm * weights.wZ).toFixed(3)),
      description: `Unusual outbound volume spike (${rawZ.toFixed(1)} standard deviations from baseline)`,
    });
  }

  // 2. Entropy Drift
  const payloadOrDns = input.dnsQuery || input.payloadSnippet || "";
  const currentEntropy = calculateShannonEntropy(payloadOrDns);
  const entropyStats = getStats(baseline.dnsEntropy);
  const entropyDiff = Math.max(0, currentEntropy - entropyStats.mean);
  const entropyDrift = Math.min(Math.max(entropyDiff / 3.0, 0), 1);
  if (entropyDrift > 0.25) {
    reasons.push({
      feature: "Payload/DNS Entropy Drift",
      observed: `${currentEntropy.toFixed(2)} bits`,
      baseline: `Baseline ${entropyStats.mean.toFixed(2)} bits`,
      contribution: parseFloat((entropyDrift * weights.wEntropy).toFixed(3)),
      description: `High informational entropy detected; signature of covert tunneling or encryption`,
    });
  }

  // 3. Sequence Risk (Kill-Chain progression)
  let sequenceRisk = 0;
  const seqContext = input.sequenceContext || [];
  const actionLower = input.action.toLowerCase();
  const processLower = (input.processName || "").toLowerCase();

  if (
    actionLower.includes("shadow_delete") ||
    processLower.includes("vssadmin") ||
    actionLower.includes("mass_encrypt")
  ) {
    sequenceRisk = 0.95;
    reasons.push({
      feature: "Attack Sequence Risk",
      observed: "VSS Shadow Deletion / Mass Encryption",
      baseline: "Administrative Backup Baseline",
      contribution: parseFloat((sequenceRisk * weights.wSeq).toFixed(3)),
      description: "Critical execution-phase ransomware behavior: Volume Shadow Copies deleted",
    });
  } else if (actionLower.includes("mimikatz") || actionLower.includes("pass_the_hash") || actionLower.includes("lsass")) {
    sequenceRisk = 0.88;
    reasons.push({
      feature: "Credential Access Sequence",
      observed: "LSASS Memory Dump / Pass-the-Hash",
      baseline: "Standard Kerberos/NTLM Auth",
      contribution: parseFloat((sequenceRisk * weights.wSeq).toFixed(3)),
      description: "Credential dumping detected targeting local security authority subsystem",
    });
  } else if (seqContext.includes("initial_access") && (actionLower.includes("port_scan") || actionLower.includes("smb_sweep"))) {
    sequenceRisk = 0.82;
    reasons.push({
      feature: "Lateral Movement Sequence",
      observed: "Post-Compromise Internal Sweep",
      baseline: "Isolated Node Traffic",
      contribution: parseFloat((sequenceRisk * weights.wSeq).toFixed(3)),
      description: "Correlated multi-stage attack: Internal reconnaissance immediately following suspicious login",
    });
  } else if (actionLower.includes("impossible_travel")) {
    sequenceRisk = 0.78;
    reasons.push({
      feature: "Authentication Sequence Anomaly",
      observed: "Dual Geo-Location Logins within 3 mins",
      baseline: "Consistent Single-Geo Profile",
      contribution: parseFloat((sequenceRisk * weights.wSeq).toFixed(3)),
      description: "Impossible physical travel velocity detected between login events",
    });
  } else if (actionLower.includes("dns_tunnel") || actionLower.includes("covert_beacon")) {
    sequenceRisk = 0.75;
    reasons.push({
      feature: "C2 Exfiltration Sequence",
      observed: "Recurring High-Entropy DNS TXT Burst",
      baseline: "Standard Recursive DNS",
      contribution: parseFloat((sequenceRisk * weights.wSeq).toFixed(3)),
      description: "Periodic beaconing pattern consistent with DNS tunneling C2 channel",
    });
  } else if (actionLower.includes("iam_attach") || actionLower.includes("admin_policy") || actionLower.includes("s3_bulk_sync")) {
    sequenceRisk = 0.86;
    reasons.push({
      feature: "Cloud Privilege Escalation Sequence",
      observed: "Unauthorized Admin Policy Attachment & Bulk Cloud Storage Sync",
      baseline: "Standard Least-Privilege IAM Profile",
      contribution: parseFloat((sequenceRisk * weights.wSeq).toFixed(3)),
      description: "Critical cloud control plane anomaly: Administrative privilege escalation followed by bulk bucket sync",
    });
  }

  // 4. Threat Intel Match
  let intelMatch = 0;
  if (
    actionLower.includes("c2_ip") ||
    actionLower.includes("tor_exit") ||
    actionLower.includes("cobalt_strike") ||
    actionLower.includes("known_malicious") ||
    actionLower.includes("exfiltration") ||
    actionLower.includes("iam_attach")
  ) {
    intelMatch = 0.90;
    reasons.push({
      feature: "Threat Intel Match",
      observed: "Matched High-Risk Threat Actor IOC / C2 ASN",
      baseline: "Verified Reputation Feed",
      contribution: parseFloat((intelMatch * weights.wIntel).toFixed(3)),
      description: "External connection attempts to IP with known adversary reputation",
    });
  } else if (input.port === 4444 || input.port === 1337 || input.port === 8888) {
    intelMatch = 0.65;
    reasons.push({
      feature: "Suspicious Port Intel",
      observed: `Port ${input.port}`,
      baseline: "Standard Corporate Ingress/Egress Ports",
      contribution: parseFloat((intelMatch * weights.wIntel).toFixed(3)),
      description: "Targeted port frequently leveraged for reverse shells and listener stagers",
    });
  }

  // Combined Anomaly Score: 0..1
  const anomalyScore = Math.min(
    1.0,
    weights.wZ * zNorm +
    weights.wEntropy * entropyDrift +
    weights.wSeq * sequenceRisk +
    weights.wIntel * intelMatch
  );

  // Context Multiplier:
  // asset criticality (0.8-1.4) x off-hours (1.15 vs 0.9) x service-account/scheduled-job match (0.4)
  // x historical access-profile match (0.6) x analyst whitelist (0.2)
  const critMap: Record<string, number> = { CRITICAL: 1.4, HIGH: 1.2, MEDIUM: 1.0, LOW: 0.8 };
  const assetFactor = critMap[input.assetCriticality || "MEDIUM"] || 1.0;
  const offHoursFactor = input.isOffHours ? 1.15 : 0.90;
  const serviceFactor = input.isServiceAccountOrScheduled ? 0.40 : 1.0;
  const historicalFactor = input.isHistoricalProfileMatch ? 0.60 : 1.0;
  const whitelistFactor = input.isWhitelisted ? 0.20 : 1.0;

  const contextMultiplier = parseFloat(
    (assetFactor * offHoursFactor * serviceFactor * historicalFactor * whitelistFactor).toFixed(3)
  );

  // Confidence = clamp(anomaly_score * context_multiplier * suppressionFactor, 0, 1)
  const rawConfidence = anomalyScore * contextMultiplier * suppressionFactor;
  const confidence = parseFloat(Math.min(Math.max(rawConfidence, 0), 1.0).toFixed(3));

  // Determine Severity Band
  let severityBand: "BENIGN" | "MEDIUM" | "HIGH" | "CRITICAL";
  if (confidence < thresholdBands.medium) {
    severityBand = "BENIGN";
  } else if (confidence < thresholdBands.high) {
    severityBand = "MEDIUM";
  } else if (confidence < thresholdBands.critical) {
    severityBand = "HIGH";
  } else {
    severityBand = "CRITICAL";
  }

  const isBenign = severityBand === "BENIGN";
  const isAnomaly = !isBenign;

  if (isBenign && (input.isServiceAccountOrScheduled || input.isWhitelisted)) {
    reasons.push({
      feature: "Contextual False-Positive Filter",
      observed: input.isServiceAccountOrScheduled ? "Scheduled Task / Backup Agent" : "Whitelisted Entity",
      baseline: "Authorized Corporate Operations",
      contribution: -0.4,
      description: "Anomaly score suppressed due to valid corporate service signature or admin whitelist",
    });
  }

  return {
    anomalyScore: parseFloat(anomalyScore.toFixed(3)),
    zNorm: parseFloat(zNorm.toFixed(3)),
    entropyDrift: parseFloat(entropyDrift.toFixed(3)),
    sequenceRisk: parseFloat(sequenceRisk.toFixed(3)),
    intelMatch: parseFloat(intelMatch.toFixed(3)),
    contextMultiplier,
    confidence,
    severityBand,
    isAnomaly,
    isBenign,
    reasons,
    rawZScore: parseFloat(rawZ.toFixed(2)),
    currentEntropy,
  };
}

/**
 * Calculates Incident Severity (0-100) based on approved rubric:
 * severity = 0.30*confidence + 0.25*asset criticality + 0.20*blast radius + 0.15*CVSS-style score + 0.10*IOC confidence
 */
export function calculateIncidentSeverity(
  confidence: number, // 0..1
  assetCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  blastRadiusPercentage: number, // 0..100
  cvssBaseScore: number, // 0..10
  iocConfidence: number // 0..1
): { severityScore: number; severityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" } {
  const critMap = { CRITICAL: 1.0, HIGH: 0.8, MEDIUM: 0.5, LOW: 0.3 };
  const critNorm = critMap[assetCriticality] || 0.5;

  const score =
    0.30 * (confidence * 100) +
    0.25 * (critNorm * 100) +
    0.20 * Math.min(Math.max(blastRadiusPercentage, 0), 100) +
    0.15 * (Math.min(Math.max(cvssBaseScore, 0), 10) * 10) +
    0.10 * (iocConfidence * 100);

  const rounded = Math.round(score);
  let level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  if (rounded >= 80) level = "CRITICAL";
  else if (rounded >= 60) level = "HIGH";
  else if (rounded >= 35) level = "MEDIUM";
  else level = "LOW";

  return { severityScore: rounded, severityLevel: level };
}
