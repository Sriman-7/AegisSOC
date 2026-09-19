import { AttackGraph, AttackGraphEdge, AttackGraphNode, AttackStep, MitreTechnique } from "./types";

export const MITRE_KNOWLEDGE_BASE: Record<string, MitreTechnique> = {
  T1078: {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Initial Access",
    description: "Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.",
  },
  T1110: {
    id: "T1110",
    name: "Brute Force",
    tactic: "Credential Access",
    description: "Adversaries may use brute force techniques to attempt access to accounts when passwords are unknown or when password hashes are obtained.",
  },
  T1059: {
    id: "T1059",
    name: "Command and Scripting Interpreter",
    tactic: "Execution",
    description: "Adversaries may abuse command and script interpreters (e.g. PowerShell, bash, cmd) to execute arbitrary commands and malicious payloads.",
  },
  T1068: {
    id: "T1068",
    name: "Exploitation for Privilege Escalation",
    tactic: "Privilege Escalation",
    description: "Adversaries may exploit software vulnerabilities in an attempt to elevate privileges from standard user to SYSTEM/root.",
  },
  T1003: {
    id: "T1003",
    name: "OS Credential Dumping",
    tactic: "Credential Access",
    description: "Adversaries may attempt to dump credentials from the operating system memory, including LSASS memory, SAM database, or LSA secrets.",
  },
  T1021: {
    id: "T1021",
    name: "Remote Services: SMB / WinRM",
    tactic: "Lateral Movement",
    description: "Adversaries may use valid accounts to log into remote services such as SMB shares or WinRM to move laterally through the enterprise network.",
  },
  T1046: {
    id: "T1046",
    name: "Network Service Discovery",
    tactic: "Discovery",
    description: "Adversaries may attempt to get a listing of other systems and services on a network to identify lateral movement candidates.",
  },
  T1048: {
    id: "T1048",
    name: "Exfiltration Over Alternative Protocol",
    tactic: "Exfiltration",
    description: "Adversaries may steal data by exfiltrating it over a different protocol than that of the existing command and control channel, such as DNS tunneling.",
  },
  T1071: {
    id: "T1071",
    name: "Application Layer Protocol: C2",
    tactic: "Command and Control",
    description: "Adversaries may communicate using application layer protocols (e.g. DNS, HTTP, HTTPS) to avoid detection/network filtering by blending in with existing traffic.",
  },
  T1490: {
    id: "T1490",
    name: "Inhibit System Recovery",
    tactic: "Impact",
    description: "Adversaries may delete or remove built-in system recovery points, volume shadow copies (VSS), and backups to prevent users from recovering data without paying ransom.",
  },
  T1486: {
    id: "T1486",
    name: "Data Encrypted for Impact",
    tactic: "Impact",
    description: "Adversaries may encrypt data on target systems to interrupt availability to system and network resources.",
  },
  T1098: {
    id: "T1098",
    name: "Account Manipulation",
    tactic: "Persistence",
    description: "Adversaries may manipulate accounts to maintain access to victim systems, such as adding cloud administrative policies or granting extra roles.",
  },
  T1530: {
    id: "T1530",
    name: "Data from Cloud Storage",
    tactic: "Collection",
    description: "Adversaries may access data from cloud storage (e.g., AWS S3, Azure Blob, Google Cloud Storage) to collect sensitive corporate archives.",
  },
};

/**
 * Reconstructs Attack Graph topology for an incident
 */
export function buildAttackGraph(
  attackType: string,
  affectedAssets: string[],
  attackerIp = "185.220.101.5",
  isolatedAssets: string[] = []
): AttackGraph {
  const nodes: AttackGraphNode[] = [];
  const edges: AttackGraphEdge[] = [];

  // Attacker external node
  nodes.push({
    id: "node-attacker",
    label: "Adversary Infrastructure",
    type: "attacker",
    ip: attackerIp,
    role: "Threat Actor C2 / Origin",
    criticality: "CRITICAL",
  });

  // Entry node & affected internal nodes
  affectedAssets.forEach((asset, idx) => {
    const isIsolated = isolatedAssets.includes(asset);
    const isFirst = idx === 0;
    const isLast = idx === affectedAssets.length - 1 && affectedAssets.length > 1;

    nodes.push({
      id: `node-${asset}`,
      label: asset,
      type: isIsolated ? "isolated" : isFirst ? "compromised" : isLast ? "at_risk" : "compromised",
      ip: `10.0.${idx + 1}.${10 + idx}`,
      role: isLast ? "Crown Jewel / Target" : isFirst ? "Initial Pivot" : "Lateral Bridge",
      criticality: isLast ? "CRITICAL" : isFirst ? "HIGH" : "MEDIUM",
    });

    if (idx === 0) {
      edges.push({
        source: "node-attacker",
        target: `node-${asset}`,
        label: attackType.includes("Credential") ? "T1110 Brute Force" : "T1078 Initial Access",
        protocol: "HTTPS/443",
        techniqueId: "T1078",
      });
    } else {
      const prevAsset = affectedAssets[idx - 1];
      edges.push({
        source: `node-${prevAsset}`,
        target: `node-${asset}`,
        label: attackType.includes("Ransomware") ? "T1486 Lateral Propagation" : "T1021 SMB Lateral RPC",
        protocol: "TCP/445",
        techniqueId: "T1021",
      });
    }
  });

  // Add adjacent uncompromised corporate node to visualize boundary protection
  nodes.push({
    id: "node-unaffected-vault",
    label: "SECURE-VAULT-01",
    type: "secure",
    ip: "10.0.99.1",
    role: "Isolated HSM / Key Vault",
    criticality: "CRITICAL",
  });

  return { nodes, edges };
}

/**
 * Calculates Blast Radius percentage based on compromised network graph
 */
export function calculateBlastRadius(
  compromisedCount: number,
  totalNetworkAssets = 12
): number {
  if (compromisedCount <= 0) return 0;
  const rawRadius = (compromisedCount / totalNetworkAssets) * 100;
  // Apply multiplier for crown jewel reachability
  const radius = Math.min(Math.round(rawRadius * 1.3), 100);
  return radius;
}
