import prisma from "../lib/prisma";
import { SCENARIOS } from "../lib/cyber/scenarios";
import { evaluateTelemetry, calculateIncidentSeverity } from "../lib/cyber/engine";
import { buildAttackGraph, calculateBlastRadius } from "../lib/cyber/correlator";
import { createRollbackPayload } from "../lib/cyber/response-orchestrator";

async function main() {
  console.log("Starting AegisSOC cybersecurity data seeding...");

  // Clean old records
  await prisma.evaluationRun.deleteMany({});
  await prisma.analystFeedback.deleteMany({});
  await prisma.defenseAction.deleteMany({});
  await prisma.telemetryEvent.deleteMany({});
  await prisma.securityIncident.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.detectionRule.deleteMany({});
  await prisma.securitySetting.deleteMany({});

  // 1. Seed Security Settings
  await prisma.securitySetting.create({
    data: {
      id: "global",
      autonomousMode: true,
      minConfidenceForAction: 0.75,
      simulationRunning: false,
      geminiApiKey: process.env.GEMINI_API_KEY || null,
      updatedAt: new Date(),
    },
  });

  // 2. Seed Detection Rule
  await prisma.detectionRule.create({
    data: {
      id: "rule-global-adaptive",
      name: "Aegis Multi-Factor Adaptive Anomaly Baseline",
      category: "BEHAVIORAL",
      wZNorm: 0.35,
      wEntropy: 0.20,
      wSequence: 0.25,
      wIntel: 0.20,
      suppressionFactor: 1.0,
      whitelistEntities: JSON.stringify(["BACKUP-STORAGE-APPLIANCE", "10.0.100.50"]),
      thresholdMedium: 0.35,
      thresholdHigh: 0.55,
      thresholdCritical: 0.80,
      updatedAt: new Date(),
    },
  });

  // 3. Seed Corporate Assets
  const assetsData = [
    { hostname: "DC-CORP-PRIMARY", ipAddress: "10.0.0.5", assetType: "SERVER", role: "Primary Active Directory Domain Controller", criticality: "CRITICAL", status: "HEALTHY", riskScore: 88 },
    { hostname: "WS-EXEC-01", ipAddress: "10.0.0.45", assetType: "ENDPOINT", role: "Executive Board Laptop (CFO)", criticality: "HIGH", status: "SUSPICIOUS", riskScore: 72 },
    { hostname: "SRV-APPS-02", ipAddress: "10.0.1.12", assetType: "SERVER", role: "Internal Microservices Application Cluster", criticality: "HIGH", status: "HEALTHY", riskScore: 45 },
    { hostname: "FS-STORAGE-04", ipAddress: "10.0.4.12", assetType: "SERVER", role: "Tier-1 Enterprise NAS & Volume Storage", criticality: "CRITICAL", status: "ISOLATED", riskScore: 95, isolatedAt: new Date() },
    { hostname: "DB-PAYMENTS-01", ipAddress: "10.0.3.15", assetType: "DATABASE", role: "PCI-DSS Tokenized Transaction Database", criticality: "CRITICAL", status: "HEALTHY", riskScore: 35 },
    { hostname: "GW-AUTH-EXTERNAL", ipAddress: "10.0.1.1", assetType: "GATEWAY", role: "Perimeter Reverse Proxy & Okta SSO Gateway", criticality: "HIGH", status: "HEALTHY", riskScore: 65 },
    { hostname: "AWS-PROD-VPC", ipAddress: "172.31.0.1", assetType: "CLOUD_VPC", role: "AWS Multi-Region Production VPC Gateway", criticality: "HIGH", status: "HEALTHY", riskScore: 78 },
    { hostname: "DB-CUSTOMER-RECORDS", ipAddress: "10.0.2.88", assetType: "DATABASE", role: "Enterprise CRM & PII Customer Vault", criticality: "HIGH", status: "HEALTHY", riskScore: 82 },
  ];

  for (const a of assetsData) {
    await prisma.asset.create({ data: a });
  }
  console.log(`Seeded ${assetsData.length} network assets.`);

  // 4. Seed Incidents based on Scenarios A, B, C, D, E
  const scenarioKeys: ("A" | "B" | "C" | "D" | "E")[] = ["C", "A", "B", "D", "E"];

  for (const key of scenarioKeys) {
    const sc = SCENARIOS[key];
    const evals = sc.telemetryStream.map((t) => evaluateTelemetry(t));
    const maxConf = Math.max(...evals.map((e) => e.confidence));
    const blastRadius = calculateBlastRadius(sc.affectedAssets.length);
    const critLevel = key === "C" || key === "A" ? "CRITICAL" : "HIGH";

    const { severityScore, severityLevel } = calculateIncidentSeverity(
      maxConf,
      critLevel,
      blastRadius,
      sc.cvssBaseScore,
      0.92
    );

    const isRansomware = key === "C";
    const status = isRansomware ? "MITIGATED" : "OPEN";

    // Build Attack Sequence JSON
    const attackSequence = sc.telemetryStream.map((t, idx) => ({
      step: idx + 1,
      timestamp: new Date(Date.now() - (sc.telemetryStream.length - idx) * 120000).toISOString(),
      phase: sc.mitreTechniques[idx]?.tactic || "Execution",
      techniqueId: sc.mitreTechniques[idx]?.id || "T1059",
      techniqueName: sc.mitreTechniques[idx]?.name || "Command Interpreter",
      source: t.sourceIp || "External",
      target: t.destIp || t.hostname || "Internal",
      description: t.action.replace(/_/g, " "),
      evidence: t.payloadSnippet || `${t.bytesOut || 1200} bytes transferred`,
      anomalyScore: evals[idx].anomalyScore,
    }));

    // Build IOC list
    const iocs = [
      { type: "IPv4", value: sc.telemetryStream[0]?.sourceIp || "185.220.101.5", reputation: "MALICIOUS", firstSeen: "10 mins ago", context: "Primary Ingress Attack Node" },
      { type: "User", value: sc.telemetryStream[0]?.username || "compromised_user", reputation: "SUSPICIOUS", firstSeen: "12 mins ago", context: "Targeted Identity Token" },
    ];
    if (sc.telemetryStream[1]?.destIp) {
      iocs.push({ type: "IPv4", value: sc.telemetryStream[1].destIp, reputation: "MALICIOUS", firstSeen: "8 mins ago", context: "Command and Control Listener" });
    }

    const aiReasoning = JSON.stringify({
      whyFlagged: [
        `High confidence anomaly detected (${(maxConf * 100).toFixed(0)}%) exceeding the 75% autonomous response barrier.`,
        `Direct correlation with MITRE ATT&CK technique ${sc.mitreTechniques[0]?.id || "T1078"} (${sc.mitreTechniques[0]?.name || "Valid Accounts"}).`,
        `Involves critical assets [${sc.affectedAssets.join(", ")}] with immediate blast radius risk of ${blastRadius}%.`,
      ],
      observableEvidence: [
        `Telemetry action: ${sc.telemetryStream[0]?.action} on host ${sc.telemetryStream[0]?.hostname}.`,
        `Outbound volumetric spike exceeding 3.5 standard deviations from rolling baseline.`,
        `Observed command payload: ${sc.telemetryStream[0]?.payloadSnippet || "Anomalous lateral RPC traversal"}.`,
      ],
      correlatedSignals: [
        `Chronological chain matched multi-stage progression: Initial Access -> Privilege Escalation -> Impact.`,
        `External IP reputation feed matches active threat campaign attributed to ${sc.threatActor}.`,
      ],
      confidenceFactors: [
        { factor: "Z-Score Volume Surge", scoreImpact: 0.35 },
        { factor: "MITRE ATT&CK Kill-Chain Match", scoreImpact: 0.25 },
        { factor: "Off-Hours Execution Context", scoreImpact: 0.20 },
        { factor: "Threat Intelligence Indicator Match", scoreImpact: 0.20 },
      ],
      threatActorHypothesis: `Activity matches known TTPs of ${sc.threatActor}. Objective appears to be ${sc.summary}.`,
      recommendedImmediateAction: `Execute autonomous ${sc.recommendedAction} on targeted assets and rotate compromised service credentials.`,
    });

    const incident = await prisma.securityIncident.create({
      data: {
        title: sc.title,
        description: sc.summary,
        severity: severityLevel,
        status,
        attackType: sc.threatActor ? `${sc.title.split(" ")[0]} Attack` : "Advanced Persistent Threat",
        attackPhase: sc.mitreTechniques[sc.mitreTechniques.length - 1]?.tactic || "Impact",
        confidence: maxConf,
        riskScore: severityScore,
        blastRadius,
        affectedAssets: JSON.stringify(sc.affectedAssets),
        attackSequence: JSON.stringify(attackSequence),
        mitreTechniques: JSON.stringify(sc.mitreTechniques.map((m) => m.id)),
        iocs: JSON.stringify(iocs),
        aiReasoning,
        recommendedActions: JSON.stringify([sc.recommendedAction, "ROTATE_CREDENTIALS", "EXPORT_REPORT"]),
        isAutonomousMitigated: isRansomware,
        scenarioKey: key,
        createdAt: new Date(Date.now() - (5 - scenarioKeys.indexOf(key)) * 360000),
        updatedAt: new Date(),
      },
    });

    // Create Telemetry Events for this incident
    for (let i = 0; i < sc.telemetryStream.length; i++) {
      const t = sc.telemetryStream[i];
      const ev = evals[i];
      await prisma.telemetryEvent.create({
        data: {
          timestamp: new Date(Date.now() - (sc.telemetryStream.length - i) * 60000),
          sourceType: t.sourceType,
          sourceIp: t.sourceIp || null,
          destIp: t.destIp || null,
          port: t.port || null,
          protocol: t.protocol || "TCP",
          username: t.username || null,
          hostname: t.hostname || null,
          processName: t.processName || null,
          action: t.action,
          status: ev.severityBand === "CRITICAL" ? "BLOCK" : "ANOMALOUS",
          anomalyScore: ev.anomalyScore,
          confidence: ev.confidence,
          isAnomaly: true,
          isBenign: false,
          zNorm: ev.zNorm,
          entropyDrift: ev.entropyDrift,
          sequenceRisk: ev.sequenceRisk,
          intelMatch: ev.intelMatch,
          contextMultiplier: ev.contextMultiplier,
          reasons: JSON.stringify(ev.reasons),
          details: JSON.stringify({ payload: t.payloadSnippet, dns: t.dnsQuery }),
          incidentId: incident.id,
        },
      });
    }

    // Create Defense Actions
    if (sc.recommendedAction && sc.recommendedAction !== "LOG_AND_MONITOR") {
      const actionType = sc.recommendedAction as any;
      const target = actionType === "ISOLATE_HOST" ? sc.affectedAssets[0] : (sc.telemetryStream[0]?.sourceIp || sc.affectedAssets[0]);
      await prisma.defenseAction.create({
        data: {
          actionType,
          target,
          incidentId: incident.id,
          status: isRansomware ? "EXECUTED" : "PENDING_APPROVAL",
          isAutonomous: true,
          latencyMs: Math.floor(95 + Math.random() * 50),
          reason: `Autonomous response triggered for ${sc.title}: Confidence ${maxConf * 100}% breached threshold.`,
          rollbackPayload: createRollbackPayload(actionType, target),
          executedAt: new Date(Date.now() - 180000),
        },
      });
    }
  }

  // 5. Seed Benign Telemetry Events (Scenario F)
  const scF = SCENARIOS["F"];
  const evF = evaluateTelemetry(scF.telemetryStream[0]);
  await prisma.telemetryEvent.create({
    data: {
      timestamp: new Date(Date.now() - 15000),
      sourceType: scF.telemetryStream[0].sourceType,
      sourceIp: scF.telemetryStream[0].sourceIp,
      destIp: scF.telemetryStream[0].destIp,
      port: scF.telemetryStream[0].port,
      protocol: scF.telemetryStream[0].protocol,
      username: scF.telemetryStream[0].username,
      hostname: scF.telemetryStream[0].hostname,
      processName: scF.telemetryStream[0].processName,
      action: scF.telemetryStream[0].action,
      status: "ALLOW",
      anomalyScore: evF.anomalyScore,
      confidence: evF.confidence,
      isAnomaly: false,
      isBenign: true,
      zNorm: evF.zNorm,
      entropyDrift: evF.entropyDrift,
      sequenceRisk: evF.sequenceRisk,
      intelMatch: evF.intelMatch,
      contextMultiplier: evF.contextMultiplier,
      reasons: JSON.stringify(evF.reasons),
      details: JSON.stringify({ note: "Legitimate scheduled backup verified via Veeam service account" }),
    },
  });

  console.log("AegisSOC database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
