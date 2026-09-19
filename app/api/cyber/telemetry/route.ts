import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { evaluateTelemetry, TelemetryInput } from "@/lib/cyber/engine";
import { getOrCreateDetectionRule } from "@/lib/cyber/continuous-learning";
import { determinePolicyActions, executeDefenseAction } from "@/lib/cyber/response-orchestrator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "40");

    const events = await prisma.telemetryEvent.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      include: { incident: { select: { id: true, title: true, severity: true } } },
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch telemetry" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TelemetryInput;
    const rule = await getOrCreateDetectionRule();
    const settings = await prisma.securitySetting.findFirst();
    const isAutonomous = settings?.autonomousMode ?? true;

    // Run real-time detection formula
    const evalResult = evaluateTelemetry(
      body,
      { wZ: rule.wZNorm, wEntropy: rule.wEntropy, wSeq: rule.wSequence, wIntel: rule.wIntel },
      rule.suppressionFactor
    );

    // Persist event to database
    const createdEvent = await prisma.telemetryEvent.create({
      data: {
        sourceType: body.sourceType,
        sourceIp: body.sourceIp || null,
        destIp: body.destIp || null,
        port: body.port || null,
        protocol: body.protocol || "TCP",
        username: body.username || null,
        hostname: body.hostname || null,
        processName: body.processName || null,
        action: body.action,
        status: evalResult.isBenign ? "ALLOW" : evalResult.severityBand === "CRITICAL" ? "BLOCK" : "ANOMALOUS",
        anomalyScore: evalResult.anomalyScore,
        confidence: evalResult.confidence,
        isAnomaly: evalResult.isAnomaly,
        isBenign: evalResult.isBenign,
        zNorm: evalResult.zNorm,
        entropyDrift: evalResult.entropyDrift,
        sequenceRisk: evalResult.sequenceRisk,
        intelMatch: evalResult.intelMatch,
        contextMultiplier: evalResult.contextMultiplier,
        reasons: JSON.stringify(evalResult.reasons),
        details: JSON.stringify({ payload: body.payloadSnippet, dns: body.dnsQuery }),
      },
    });

    let triggeredActions: any[] = [];

    // Trigger Autonomous Response if confidence breaches threshold and not benign
    if (evalResult.confidence >= (settings?.minConfidenceForAction || 0.75) && !evalResult.isBenign) {
      const policyActions = determinePolicyActions(
        evalResult.severityBand === "BENIGN" ? "LOW" : evalResult.severityBand,
        body.action,
        body.hostname,
        body.sourceIp,
        body.username
      );

      for (const p of policyActions) {
        const actionResult = await executeDefenseAction(
          p.actionType,
          p.target,
          undefined,
          p.reason,
          isAutonomous
        );
        triggeredActions.push(actionResult);
      }
    }

    return NextResponse.json({
      success: true,
      event: createdEvent,
      evaluation: evalResult,
      triggeredActions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to ingest telemetry" }, { status: 500 });
  }
}
