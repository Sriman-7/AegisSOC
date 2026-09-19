import prisma from "../prisma";
import { ActionType, Severity } from "./types";

export interface DefenseActionExecutionResult {
  id: string;
  actionType: ActionType;
  target: string;
  incidentId?: string;
  status: "EXECUTED" | "PENDING_APPROVAL" | "REVERTED" | "FAILED";
  isAutonomous: boolean;
  latencyMs: number;
  reason: string;
  rollbackPayload: string;
  executedAt: Date;
}

/**
 * Determines appropriate defense actions based on severity band and attack context:
 * Low: enrich and tag
 * Medium: step-up MFA, rate limit, egress restriction
 * High: temporary IP block, token revocation, process kill
 * Critical: subnet isolation, endpoint quarantine, firewall drop rule
 */
export function determinePolicyActions(
  severity: Severity,
  attackType: string,
  targetHost?: string,
  targetIp?: string,
  targetUser?: string
): { actionType: ActionType; target: string; reason: string }[] {
  const actions: { actionType: ActionType; target: string; reason: string }[] = [];

  switch (severity) {
    case "CRITICAL":
      if (targetHost) {
        actions.push({
          actionType: "ISOLATE_HOST",
          target: targetHost,
          reason: `Critical threat (${attackType}): Autonomous endpoint quarantine applied to prevent lateral spread.`,
        });
      }
      if (targetIp && !targetIp.startsWith("10.") && !targetIp.startsWith("192.168.")) {
        actions.push({
          actionType: "FIREWALL_DROP",
          target: targetIp,
          reason: `Critical egress alert: Autonomous drop rule injected at perimeter gateway for adversary C2 ${targetIp}.`,
        });
      }
      break;

    case "HIGH":
      if (targetIp && !targetIp.startsWith("10.") && !targetIp.startsWith("192.168.")) {
        actions.push({
          actionType: "BLOCK_IP",
          target: targetIp,
          reason: `High severity intrusion attempt (${attackType}): Ingress traffic blocked at edge firewall.`,
        });
      }
      if (targetUser) {
        actions.push({
          actionType: "REVOKE_TOKEN",
          target: targetUser,
          reason: `High severity credential breach detected: Active OAuth/Kerberos session revoked for ${targetUser}.`,
        });
      }
      if (targetHost && actions.length === 0) {
        actions.push({
          actionType: "RATE_LIMIT",
          target: targetHost,
          reason: `High severity activity on ${targetHost}: Outbound network bandwidth throttled to 10kbps.`,
        });
      }
      break;

    case "MEDIUM":
      if (targetUser) {
        actions.push({
          actionType: "MFA_CHALLENGE",
          target: targetUser,
          reason: `Medium anomaly: Enforced mandatory step-up FIDO2/MFA authentication for ${targetUser}.`,
        });
      } else if (targetIp) {
        actions.push({
          actionType: "RATE_LIMIT",
          target: targetIp,
          reason: `Medium anomaly: Rate-limiting IP ${targetIp} to 5 requests per minute.`,
        });
      }
      break;

    case "LOW":
    default:
      // Low severity is tagged and enriched silently in telemetry
      break;
  }

  return actions;
}

/**
 * Builds the reversible state rollback payload
 */
export function createRollbackPayload(actionType: ActionType, target: string): string {
  switch (actionType) {
    case "ISOLATE_HOST":
      return JSON.stringify({
        command: `netsh advfirewall firewall delete name='AegisQuarantine_${target}'`,
        revertState: { hostname: target, status: "HEALTHY", networkAccess: "RESTORED" },
        apiCall: `/api/cyber/assets/${target}/restore`,
      });
    case "BLOCK_IP":
      return JSON.stringify({
        command: `iptables -D INPUT -s ${target} -j DROP`,
        revertState: { ipAddress: target, firewallRule: "ALLOW_REINSTATED" },
        apiCall: `/api/cyber/firewall/unblock`,
      });
    case "REVOKE_TOKEN":
      return JSON.stringify({
        command: `aegis-iam session restore --user ${target} --reason 'Analyst rollback'`,
        revertState: { username: target, tokenStatus: "REINSTATED" },
        apiCall: `/api/cyber/iam/restore-session`,
      });
    case "KILL_PROCESS":
      return JSON.stringify({
        command: `systemctl restart aegis-agent-managed-service`,
        revertState: { target, state: "RESTARTED" },
      });
    case "FIREWALL_DROP":
      return JSON.stringify({
        command: `iptables -D FORWARD -d ${target} -j DROP`,
        revertState: { target, route: "DEFAULT_GATEWAY_RESTORED" },
      });
    case "RATE_LIMIT":
      return JSON.stringify({
        command: `tc qdisc del dev eth0 root`,
        revertState: { target, rateLimit: "UNLIMITED" },
      });
    case "MFA_CHALLENGE":
      return JSON.stringify({
        command: `aegis-iam mfa step-down --user ${target}`,
        revertState: { target, mfaRequirement: "STANDARD" },
      });
    default:
      return JSON.stringify({ command: `aegis-defense restore --target ${target}`, revertState: { target, status: "RESTORED" } });
  }
}

/**
 * Executes or queues a defensive action in the database
 */
export async function executeDefenseAction(
  actionType: ActionType,
  target: string,
  incidentId?: string,
  reason = "Autonomous threshold breached",
  isAutonomous = true
): Promise<DefenseActionExecutionResult> {
  const rollbackPayload = createRollbackPayload(actionType, target);
  // Latency simulation (85-160ms for autonomous execution)
  const latencyMs = isAutonomous ? Math.floor(85 + Math.random() * 75) : 0;
  const status = isAutonomous ? "EXECUTED" : "PENDING_APPROVAL";

  // If isolating host, mark asset status as ISOLATED in DB
  if (actionType === "ISOLATE_HOST" && isAutonomous) {
    try {
      await prisma.asset.updateMany({
        where: { hostname: target },
        data: { status: "ISOLATED", isolatedAt: new Date() },
      });
    } catch {
      // Ignore if asset doesn't exist yet
    }
  }

  const created = await prisma.defenseAction.create({
    data: {
      actionType,
      target,
      incidentId: incidentId || null,
      status,
      isAutonomous,
      latencyMs,
      reason,
      rollbackPayload,
      executedAt: new Date(),
    },
  });

  return {
    id: created.id,
    actionType,
    target,
    incidentId,
    status: created.status as any,
    isAutonomous,
    latencyMs,
    reason,
    rollbackPayload,
    executedAt: created.executedAt,
  };
}

/**
 * Reverts an executed defensive action using the rollback payload
 */
export async function rollbackDefenseAction(
  actionId: string,
  revertedBy = "Security Administrator"
) {
  const action = await prisma.defenseAction.findUnique({
    where: { id: actionId },
  });

  if (!action) {
    throw new Error(`Defense action ${actionId} not found`);
  }

  if (action.status === "REVERTED") {
    return { success: true, message: "Action was already reverted", action };
  }

  // If the action was host isolation, restore asset status to HEALTHY
  if (action.actionType === "ISOLATE_HOST") {
    await prisma.asset.updateMany({
      where: { hostname: action.target },
      data: { status: "HEALTHY", isolatedAt: null },
    });
  }

  const updated = await prisma.defenseAction.update({
    where: { id: actionId },
    data: {
      status: "REVERTED",
      revertedAt: new Date(),
      revertedBy,
    },
  });

  return {
    success: true,
    message: `Successfully rolled back ${action.actionType} on target ${action.target}. Network state restored.`,
    action: updated,
  };
}
