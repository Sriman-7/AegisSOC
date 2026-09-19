import prisma from "../prisma";
import { Severity } from "./types";

export interface PriorityBreakdown {
  severityScore: number;
  assetScore: number;
  blastScore: number;
  iocScore: number;
  totalPriority: number;
  formula: string;
}

/**
 * Computes composite priority score (0..100) with explicit factor attribution:
 * Priority = 0.35*Severity + 0.25*AssetCriticality + 0.20*BlastRadius + 0.20*IOCConfidence
 */
export function calculatePriorityBreakdown(
  severity: Severity | string,
  assetCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string = "HIGH",
  blastRadius: number = 50,
  confidence: number = 0.85
): PriorityBreakdown {
  const severityMap: Record<string, number> = {
    CRITICAL: 100,
    HIGH: 80,
    MEDIUM: 50,
    LOW: 25,
    BENIGN: 10,
  };

  const assetMap: Record<string, number> = {
    CRITICAL: 100,
    HIGH: 80,
    MEDIUM: 55,
    LOW: 30,
  };

  const severityScore = severityMap[severity.toUpperCase()] || 60;
  const assetScore = assetMap[assetCriticality.toUpperCase()] || 70;
  const blastScore = Math.min(Math.max(blastRadius, 0), 100);
  const iocScore = Math.min(Math.max(confidence * 100, 0), 100);

  const totalPriority = Math.round(
    0.35 * severityScore +
    0.25 * assetScore +
    0.20 * blastScore +
    0.20 * iocScore
  );

  return {
    severityScore,
    assetScore,
    blastScore,
    iocScore,
    totalPriority,
    formula: "0.35*Severity( " + severityScore + " ) + 0.25*AssetCriticality( " + assetScore + " ) + 0.20*BlastRadius( " + blastScore + " ) + 0.20*IOCConfidence( " + iocScore + " )",
  };
}

/**
 * Records an immutable audit log entry for the incident lifecycle timeline
 */
export async function recordTimelineEvent(
  incidentId: string,
  eventType: "DETECTION" | "AI_ANALYSIS" | "AUTONOMOUS_RESPONSE" | "MANUAL_ACTION" | "ROLLBACK" | "STATUS_CHANGE" | "NOTE_ADDED" | "FEEDBACK_SUBMITTED",
  actor: "SYSTEM" | "AI" | "ANALYST",
  description: string,
  metadata?: Record<string, any>
) {
  try {
    return await prisma.incidentTimelineEvent.create({
      data: {
        incidentId,
        eventType,
        actor,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to record timeline event:", err);
    return null;
  }
}

/**
 * Updates incident status and logs corresponding lifecycle transitions
 */
export async function updateIncidentLifecycle(
  incidentId: string,
  newStatus: "NEW" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "CLOSED" | "FALSE_POSITIVE",
  actor: "SYSTEM" | "AI" | "ANALYST" = "ANALYST",
  notes?: string,
  resolutionSummary?: string,
  rootCause?: string,
  assignee?: string
) {
  const current = await prisma.securityIncident.findUnique({
    where: { id: incidentId },
  });

  if (!current) throw new Error(`Incident ${incidentId} not found`);

  const now = new Date();
  const updateData: any = {
    status: newStatus,
    updatedAt: now,
  };

  if (notes) updateData.analystNotes = notes;
  if (resolutionSummary) updateData.resolutionSummary = resolutionSummary;
  if (rootCause) updateData.rootCause = rootCause;
  if (assignee) updateData.assignee = assignee;

  if (newStatus === "RESOLVED" && !current.resolvedAt) {
    updateData.resolvedAt = now;
  }
  if (newStatus === "CLOSED" && !current.closedAt) {
    updateData.closedAt = now;
  }

  const updated = await prisma.securityIncident.update({
    where: { id: incidentId },
    data: updateData,
  });

  await recordTimelineEvent(
    incidentId,
    "STATUS_CHANGE",
    actor,
    `Status transitioned from ${current.status} to ${newStatus}${notes ? ': ' + notes : ''}`,
    { previousStatus: current.status, newStatus, assignee }
  );

  return updated;
}
