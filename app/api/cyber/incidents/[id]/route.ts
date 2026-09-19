import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildAttackGraph } from "@/lib/cyber/correlator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await prisma.securityIncident.findUnique({
      where: { id },
      include: {
        events: { orderBy: { timestamp: "asc" } },
        actions: { orderBy: { executedAt: "desc" } },
        feedbacks: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const affectedAssets = JSON.parse(incident.affectedAssets || "[]") as string[];
    const isolatedActions = incident.actions.filter(
      (a) => a.actionType === "ISOLATE_HOST" && a.status === "EXECUTED"
    );
    const isolatedAssets = isolatedActions.map((a) => a.target);

    // Build interactive topological attack graph
    const attackGraph = buildAttackGraph(
      incident.attackType,
      affectedAssets,
      "185.220.101.5",
      isolatedAssets
    );

    return NextResponse.json({
      incident,
      attackGraph,
      affectedAssets,
      attackSequence: JSON.parse(incident.attackSequence || "[]"),
      mitreTechniques: JSON.parse(incident.mitreTechniques || "[]"),
      iocs: JSON.parse(incident.iocs || "[]"),
      aiReasoning: JSON.parse(incident.aiReasoning || "{}"),
      recommendedActions: JSON.parse(incident.recommendedActions || "[]"),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch incident details" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, severity } = body;

    const data: any = {};
    if (status) data.status = status;
    if (severity) data.severity = severity;

    const updated = await prisma.securityIncident.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update incident" }, { status: 500 });
  }
}
