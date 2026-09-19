import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { executeDefenseAction } from "@/lib/cyber/response-orchestrator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;

    const actions = await prisma.defenseAction.findMany({
      where,
      orderBy: { executedAt: "desc" },
      include: {
        incident: { select: { id: true, title: true, severity: true, attackType: true } },
      },
    });

    const total = actions.length;
    const executed = actions.filter((a) => a.status === "EXECUTED").length;
    const reverted = actions.filter((a) => a.status === "REVERTED").length;
    const pending = actions.filter((a) => a.status === "PENDING_APPROVAL").length;

    return NextResponse.json({
      actions,
      stats: { total, executed, reverted, pending },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch defense actions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionType, target, incidentId, reason, isAutonomous } = body;

    const result = await executeDefenseAction(
      actionType,
      target,
      incidentId,
      reason || "Manual SOC execution",
      isAutonomous !== undefined ? isAutonomous : true
    );

    return NextResponse.json({ success: true, action: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to execute defense action" }, { status: 500 });
  }
}
