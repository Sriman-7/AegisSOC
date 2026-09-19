import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildAttackGraph, calculateBlastRadius, MITRE_KNOWLEDGE_BASE } from "@/lib/cyber/correlator";
import { generateAIThreatAnalysis } from "@/lib/cyber/ai-analyst";
import { IncidentPatchSchema } from "@/lib/cyber/validation";
import { checkRateLimit } from "@/lib/cyber/rate-limiter";
import { findSimilarHistoricalIncidents } from "@/lib/cyber/historical-learning";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`get-incident-${ip}`, 120, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Invalid incident ID" }, { status: 400 });

    const incident = await prisma.securityIncident.findUnique({
      where: { id },
      include: {
        events: { orderBy: { timestamp: "asc" } },
        actions: { orderBy: { executedAt: "desc" } },
        feedbacks: { orderBy: { createdAt: "desc" } },
        timelineEvents: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

    const affectedAssets = JSON.parse(incident.affectedAssets || "[]") as string[];
    const mitreCodes = JSON.parse(incident.mitreTechniques || "[]") as string[];
    const sourceIp = incident.events[0]?.sourceIp || "185.220.101.5";

    const attackGraph = buildAttackGraph(incident.attackType, affectedAssets, sourceIp);
    const blastRadius = calculateBlastRadius(affectedAssets.length, 12);
    const mitreDetails = mitreCodes.map((c) => MITRE_KNOWLEDGE_BASE[c]).filter(Boolean);
    const aiAnalysis = await generateAIThreatAnalysis(incident, mitreCodes);
    const similarIncidents = await findSimilarHistoricalIncidents(incident.attackType, mitreCodes, incident.severity);

    return NextResponse.json({
      incident,
      attackGraph,
      blastRadius,
      mitreDetails,
      aiAnalysis,
      similarIncidents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load incident details" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rawBody = await req.json();
    const parseResult = IncidentPatchSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid patch payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { status, notes } = parseResult.data;

    const updated = await prisma.securityIncident.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes ? { analystNotes: notes } : {}),
        ...(status === "MITIGATED" || status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}
