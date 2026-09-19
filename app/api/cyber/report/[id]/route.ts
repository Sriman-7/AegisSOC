import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MITRE_KNOWLEDGE_BASE } from "@/lib/cyber/correlator";
import { IncidentReport } from "@/lib/cyber/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await prisma.securityIncident.findUnique({
      where: { id },
      include: {
        actions: { orderBy: { executedAt: "asc" } },
        feedbacks: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const affected = JSON.parse(incident.affectedAssets || "[]") as string[];
    const assetsRecords = await prisma.asset.findMany({
      where: { hostname: { in: affected } },
    });

    const mitreIds = JSON.parse(incident.mitreTechniques || "[]") as string[];
    const mitreCoverage = mitreIds
      .map((id) => MITRE_KNOWLEDGE_BASE[id])
      .filter(Boolean);

    const report: any = {
      incidentId: incident.id,
      title: incident.title,
      generatedAt: new Date().toISOString(),
      executiveSummary: `On ${incident.createdAt.toUTCString()}, AegisSOC autonomous detection engine intercepted a ${incident.severity} severity security incident classified as "${incident.attackType}". The attack reached an AI confidence level of ${(incident.confidence * 100).toFixed(0)}% with a potential blast radius of ${incident.blastRadius}% across targeted corporate assets: [${affected.join(", ")}]. Autonomous containment policies were triggered with sub-second response latency.`,
      severity: incident.severity as any,
      riskScore: incident.riskScore,
      blastRadiusPercentage: incident.blastRadius,
      attackType: incident.attackType,
      mitreCoverage,
      attackSequence: JSON.parse(incident.attackSequence || "[]"),
      affectedAssets: assetsRecords.map((a) => ({
        hostname: a.hostname,
        ip: a.ipAddress,
        role: a.role,
        status: a.status,
      })),
      iocs: JSON.parse(incident.iocs || "[]"),
      autonomousDefensesTriggered: incident.actions.map((a) => ({
        action: a.actionType as any,
        target: a.target,
        executedAt: a.executedAt.toISOString(),
        status: a.status,
        isAutonomous: a.isAutonomous,
      })),
      postIncidentRecommendations: [
        `Complete forensic memory preservation on [${affected.join(", ")}] prior to host reimaging.`,
        `Mandate credential reset and hardware FIDO2 MFA token re-enrollment for all compromised identities.`,
        `Audit perimeter egress firewall logs for secondary beaconing to adversary infrastructure.`,
        `Review and verify offline backup immutable snapshots.`,
      ],
    };

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
