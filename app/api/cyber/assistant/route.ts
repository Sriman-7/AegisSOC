import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { queryInvestigationAssistant } from "@/lib/cyber/ai-analyst";
import { AssistantQuerySchema } from "@/lib/cyber/validation";
import { checkRateLimit } from "@/lib/cyber/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`assistant-${ip}`, 60, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const rawBody = await req.json();
    const parseResult = AssistantQuerySchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid assistant query", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { query, incidentId, conversationHistory } = parseResult.data;

    let incidentContext: any = null;
    if (incidentId) {
      const inc = await prisma.securityIncident.findUnique({
        where: { id: incidentId },
        include: {
          events: { take: 10, orderBy: { timestamp: "desc" } },
          actions: true,
        },
      });
      if (inc) {
        incidentContext = {
          incidentTitle: inc.title,
          attackType: inc.attackType,
          confidence: inc.confidence,
          severity: inc.severity,
          affectedAssets: JSON.parse(inc.affectedAssets || "[]"),
          actions: inc.actions.map((a) => a.actionType + " on " + a.target),
        };
      }
    }

    const response = await queryInvestigationAssistant(
      query,
      incidentContext || {},
      conversationHistory || []
    );

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Investigation copilot error" }, { status: 500 });
  }
}
