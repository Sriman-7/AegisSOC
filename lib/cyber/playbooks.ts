import { ActionType, Severity } from "./types";

export interface SOARPlaybook {
  id: string;
  name: string;
  category: "RANSOMWARE" | "CREDENTIALS" | "EXFILTRATION" | "LATERAL_MOVEMENT" | "CLOUD_SECURITY";
  description: string;
  severityTrigger: Severity[];
  mitreTriggers: string[];
  autonomousEnabled: boolean;
  actions: {
    step: number;
    actionType: ActionType;
    targetDescription: string;
    delayMs: number;
    isCritical: boolean;
  }[];
  executionCount: number;
  successRate: number;
  lastTriggered?: string;
}

export const ACTIVE_SOAR_PLAYBOOKS: SOARPlaybook[] = [
  {
    id: "pb-ransomware-lockdown",
    name: "Zero-Trust Ransomware Containment Protocol",
    category: "RANSOMWARE",
    description: "Instantly severs host network connectivity upon shadow copy deletion or rapid entropy encryption detection.",
    severityTrigger: ["CRITICAL", "HIGH"],
    mitreTriggers: ["T1486", "T1490"],
    autonomousEnabled: true,
    actions: [
      { step: 1, actionType: "ISOLATE_HOST", targetDescription: "Compromised Endpoint Network Interface (Layer 2/3 Port Shutdown)", delayMs: 0, isCritical: true },
      { step: 2, actionType: "SUSPEND_BACKUP_JOBS", targetDescription: "Enterprise Storage & Veeam Repositories", delayMs: 25, isCritical: true },
      { step: 3, actionType: "KILL_PROCESS", targetDescription: "Malicious vssadmin/PowerShell Parent Processes", delayMs: 50, isCritical: false },
      { step: 4, actionType: "ALERT_SECOPS", targetDescription: "Emergency SecOps On-Call Broadcast", delayMs: 100, isCritical: false },
    ],
    executionCount: 14,
    successRate: 100,
    lastTriggered: "10 mins ago",
  },
  {
    id: "pb-apt-lateral-shunt",
    name: "APT Lateral Movement & Domain Controller Shunt",
    category: "LATERAL_MOVEMENT",
    description: "Detects memory credential harvesting (LSASS dumping) and intercepts Pass-the-Hash traversal toward Domain Controllers.",
    severityTrigger: ["CRITICAL", "HIGH"],
    mitreTriggers: ["T1003", "T1055", "T1078"],
    autonomousEnabled: true,
    actions: [
      { step: 1, actionType: "REVOKE_CREDENTIALS", targetDescription: "Compromised Kerberos/Active Directory Service Account Tokens", delayMs: 0, isCritical: true },
      { step: 2, actionType: "ISOLATE_HOST", targetDescription: "Target Workstation / Staging Pivot Host", delayMs: 30, isCritical: true },
      { step: 3, actionType: "BLOCK_IP", targetDescription: "Adversary C2 Ingress IPv4 at Perimeter Edge", delayMs: 60, isCritical: false },
    ],
    executionCount: 8,
    successRate: 100,
    lastTriggered: "32 mins ago",
  },
  {
    id: "pb-cred-stuffing-ban",
    name: "Distributed Credential Stuffing & Botnet Mitigation",
    category: "CREDENTIALS",
    description: "Aggregates failed auth logs across disparate geographic coordinates and injects dynamic perimeter blocklist rules.",
    severityTrigger: ["HIGH", "MEDIUM"],
    mitreTriggers: ["T1110", "T1078"],
    autonomousEnabled: true,
    actions: [
      { step: 1, actionType: "BLOCK_IP", targetDescription: "Distributed Botnet IP Subnet CIDR (/24) at WAF", delayMs: 0, isCritical: true },
      { step: 2, actionType: "REVOKE_CREDENTIALS", targetDescription: "Targeted User Account Sessions & Force MFA Prompt", delayMs: 40, isCritical: true },
    ],
    executionCount: 39,
    successRate: 98.2,
    lastTriggered: "1 hour ago",
  },
  {
    id: "pb-dns-exfil-sinkhole",
    name: "Covert DNS Tunneling & Sinkhole Interceptor",
    category: "EXFILTRATION",
    description: "Monitors abnormal DNS request lengths and high-entropy subdomains, diverting exfiltration tunnels to an internal blackhole sink.",
    severityTrigger: ["HIGH", "CRITICAL"],
    mitreTriggers: ["T1071", "T1048"],
    autonomousEnabled: true,
    actions: [
      { step: 1, actionType: "BLOCK_IP", targetDescription: "Malicious Authoritative Name Server IP", delayMs: 0, isCritical: true },
      { step: 2, actionType: "QUARANTINE_FILE", targetDescription: "Tunneling Stager Binary on Source Workstation", delayMs: 45, isCritical: false },
      { step: 3, actionType: "ALERT_SECOPS", targetDescription: "SOC Tier-2 Data Loss Prevention Alert", delayMs: 80, isCritical: false },
    ],
    executionCount: 11,
    successRate: 100,
    lastTriggered: "3 hours ago",
  },
  {
    id: "pb-cloud-iam-lockout",
    name: "Cloud IAM Privilege Escalation Emergency Lockout",
    category: "CLOUD_SECURITY",
    description: "Triggers on unauthorized Admin policy attachments and mass S3 data reads, revoking STS tokens and isolating the cloud VPC.",
    severityTrigger: ["CRITICAL"],
    mitreTriggers: ["T1548", "T1530"],
    autonomousEnabled: true,
    actions: [
      { step: 1, actionType: "REVOKE_CREDENTIALS", targetDescription: "Compromised AWS IAM Access Keys & Active STS Sessions", delayMs: 0, isCritical: true },
      { step: 2, actionType: "ISOLATE_HOST", targetDescription: "Detached Cloud VPC Gateway & Restrict S3 Bucket Policies", delayMs: 20, isCritical: true },
      { step: 3, actionType: "ALERT_SECOPS", targetDescription: "Cloud Infrastructure Security Incident Broadcast", delayMs: 50, isCritical: false },
    ],
    executionCount: 6,
    successRate: 100,
    lastTriggered: "Yesterday",
  },
];
