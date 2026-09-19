import { z } from "zod";

export const TelemetryInputSchema = z.object({
  sourceType: z.enum(["NETWORK_FLOW", "AUTH_LOG", "PROCESS_EXEC", "DNS_QUERY", "FILE_INTEGRITY", "CLOUD_AUDIT"]),
  sourceIp: z.string().max(64).optional(),
  destIp: z.string().max(64).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  protocol: z.string().max(16).default("TCP"),
  username: z.string().max(128).optional(),
  hostname: z.string().max(128).optional(),
  processName: z.string().max(256).optional(),
  action: z.string().min(1).max(256),
  bytesTransferred: z.number().nonnegative().optional(),
  flowCount: z.number().nonnegative().optional(),
  payloadSnippet: z.string().max(4096).optional(),
  dnsQuery: z.string().max(512).optional(),
  authFailures: z.number().int().nonnegative().optional(),
  mitreCode: z.string().max(32).optional(),
  contextNotes: z.string().max(1024).optional(),
});

export const IncidentPatchSchema = z.object({
  status: z.enum(["ACTIVE", "INVESTIGATING", "CONTAINED", "MITIGATED", "RESOLVED", "FALSE_POSITIVE"]).optional(),
  notes: z.string().max(2048).optional(),
});

export const ActionExecuteSchema = z.object({
  actionType: z.enum(["ISOLATE_HOST", "BLOCK_IP", "REVOKE_CREDENTIALS", "KILL_PROCESS", "QUARANTINE_FILE", "SUSPEND_BACKUP_JOBS", "ALERT_SECOPS"]),
  target: z.string().min(1).max(256),
  incidentId: z.string().max(128).optional(),
  reason: z.string().min(1).max(1024),
});

export const FeedbackInputSchema = z.object({
  incidentId: z.string().min(1).max(128),
  feedbackType: z.enum(["TRUE_POSITIVE", "FALSE_POSITIVE"]),
  notes: z.string().max(1024).optional(),
  adjustedWeights: z.object({
    wZ: z.number().min(0).max(1).optional(),
    wEntropy: z.number().min(0).max(1).optional(),
    wSeq: z.number().min(0).max(1).optional(),
    wIntel: z.number().min(0).max(1).optional(),
  }).optional(),
});

export const AssistantQuerySchema = z.object({
  query: z.string().min(1).max(2048),
  incidentId: z.string().max(128).optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(4096),
    })
  ).optional(),
});

export const SimulationInputSchema = z.object({
  scenarioKey: z.enum(["A", "B", "C", "D", "E", "F"]),
  executeAutonomousAction: z.boolean().optional(),
});
