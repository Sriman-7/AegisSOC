export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus = "NEW" | "OPEN" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "CLOSED" | "FALSE_POSITIVE";
export type SourceType = "NETWORK" | "SYSTEM" | "AUTH" | "ALERT" | "DNS_QUERY" | "CLOUD_AUDIT";
export type ActionType = 
  | "ISOLATE_HOST"
  | "BLOCK_IP"
  | "REVOKE_TOKEN"
  | "REVOKE_CREDENTIALS"
  | "KILL_PROCESS"
  | "FIREWALL_DROP"
  | "RATE_LIMIT"
  | "MFA_CHALLENGE"
  | "SUSPEND_BACKUP_JOBS"
  | "ALERT_SECOPS"
  | "QUARANTINE_FILE";

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

export interface AttackStep {
  step: number;
  timestamp: string;
  phase: string;
  techniqueId: string;
  techniqueName: string;
  source: string;
  target: string;
  description: string;
  evidence: string;
  anomalyScore: number;
}

export interface AttackGraphNode {
  id: string;
  label: string;
  type: "attacker" | "compromised" | "at_risk" | "isolated" | "secure";
  ip?: string;
  role?: string;
  criticality?: string;
}

export interface AttackGraphEdge {
  source: string;
  target: string;
  label: string;
  protocol?: string;
  techniqueId?: string;
}

export interface AttackGraph {
  nodes: AttackGraphNode[];
  edges: AttackGraphEdge[];
}

export interface IOCItem {
  type: "IPv4" | "Domain" | "Hash" | "User" | "Process";
  value: string;
  reputation: "MALICIOUS" | "SUSPICIOUS" | "UNKNOWN" | "CLEAN";
  firstSeen: string;
  context: string;
}

export interface ExplainableAIReasoning {
  whyFlagged: string[];
  observableEvidence: string[];
  correlatedSignals: string[];
  confidenceFactors: { factor: string; scoreImpact: number }[];
  threatActorHypothesis: string;
  mitreTechniques?: MitreTechnique[];
  remediationGuidance: string[];
}

export interface IncidentReport {
  id: string;
  incidentId?: string;
  blastRadiusPercentage?: number;
  mitreCoverage?: any[];
  executiveSummary?: string;
  autonomousDefensesTriggered?: any[];
  postIncidentRecommendations?: string[];
  generatedAt?: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  attackType: string;
  confidence: number;
  riskScore: number;
  blastRadius: number;
  affectedAssets: any[];
  mitreTechniques: MitreTechnique[];
  attackSequence: AttackStep[];
  iocs: IOCItem[];
  aiReasoning: ExplainableAIReasoning;
  actionsTaken: any[];
  createdAt: string;
  resolvedAt?: string;
}
