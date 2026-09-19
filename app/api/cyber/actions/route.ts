import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { executeDefenseAction } from "@/lib/cyber/response-orchestrator";
import { ActionType } from "@/lib/cyber/types";
import { ActionExecuteSchema } from "@/lib/cyber/validation";
import { checkRateLimit } from "@/lib/cyber/rate-limiter";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`get-actions-${ip}`, 150, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const incidentId = searchParams.get("incidentId");

    const actions = await prisma.defenseAction.findMany({
      where: incidentId ? { incidentId } : undefined,
      orderBy: { executedAt: "desc" },
      include: {
        incident: { select: { id: true, title: true, severity: true } },
      },
    });

    return NextResponse.json({ actions });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`post-actions-${ip}`, 100, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const rawBody = await req.json();
    const parseResult = ActionExecuteSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid action execution payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { actionType, target, incidentId, reason } = parseResult.data;

    const result = await executeDefenseAction(
      actionType as ActionType,
      target,
      incidentId,
      reason,
      false // manual trigger
    );

    return NextResponse.json({ success: true, action: result });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to execute defense action" }, { status: 500 });
  }
}
