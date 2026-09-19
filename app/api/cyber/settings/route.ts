import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.securitySetting.findFirst();
    if (!settings) {
      settings = await prisma.securitySetting.create({
        data: {
          id: "global",
          autonomousMode: true,
          minConfidenceForAction: 0.75,
          simulationRunning: false,
          geminiApiKey: process.env.GEMINI_API_KEY || null,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { autonomousMode, minConfidenceForAction, geminiApiKey } = body;

    const data: any = {};
    if (autonomousMode !== undefined) data.autonomousMode = autonomousMode;
    if (minConfidenceForAction !== undefined) data.minConfidenceForAction = minConfidenceForAction;
    if (geminiApiKey !== undefined) data.geminiApiKey = geminiApiKey;

    const updated = await prisma.securitySetting.upsert({
      where: { id: "global" },
      update: data,
      create: {
        id: "global",
        autonomousMode: autonomousMode !== undefined ? autonomousMode : true,
        minConfidenceForAction: minConfidenceForAction || 0.75,
        geminiApiKey: geminiApiKey || null,
        simulationRunning: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
