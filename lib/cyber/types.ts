export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus = "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED";
export type SourceType = "NETWORK" | "SYSTEM" | "AUTH" | "ALERT";
export type ActionType = 
  | "ISOLATE_HOST"
  | "BLOCK_IP"
  | "REVOKE_TOKEN"
  | "KILL_PROCESS"
  | "FIREWALL_DROP"
  | "RATE_LIMIT"
  | "MFA_CHALLENGE";

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
  recommendedImmediateAction: string;
}

export interface IncidentReport {
  incidentId: string;
  title: string;
  generatedAt: string;
  executiveSummary: string;
  severity: Severity;
  riskScore: number;
  blastRadiusPercentage: number;
  attackType: string;
  mitreCoverage: MitreTechnique[];
  attackSequence: AttackStep[];
  affectedAssets: { hostname: string; ip: string; role: string; status: string }[];
  iocs: IOCItem[];
  autonomousDefensesTriggered: {
    action: ActionType;
    target: string;
    executedAt: string;
    status: string;
    isAutonomous: boolean;
  }[];
  postIncidentRecommendations: string[];
}
