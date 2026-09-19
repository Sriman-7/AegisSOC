import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getThreatIntelligenceTrends, getProactiveHardeningRecommendations } from "@/lib/cyber/continuous-learning";

export async function GET() {
  try {
    const trends = await getThreatIntelligenceTrends();
    const recommendations = getProactiveHardeningRecommendations();
    const latestEvaluation = await prisma.evaluationRun.findFirst({
      orderBy: { timestamp: "desc" },
    });

    const recentFeedbacks = await prisma.analystFeedback.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        incident: { select: { id: true, title: true, severity: true, attackType: true } },
      },
    });

    return NextResponse.json({
      trends,
      recommendations,
      latestEvaluation,
      recentFeedbacks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch intelligence" }, { status: 500 });
  }
}
