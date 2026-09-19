import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { evaluateTelemetry, TelemetryInput } from "@/lib/cyber/engine";
import { getOrCreateDetectionRule } from "@/lib/cyber/continuous-learning";
import { determinePolicyActions, executeDefenseAction } from "@/lib/cyber/response-orchestrator";
import { TelemetryInputSchema } from "@/lib/cyber/validation";
import { checkRateLimit } from "@/lib/cyber/rate-limiter";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`get-telemetry-${ip}`, 200, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "40"), 1), 100);

    const events = await prisma.telemetryEvent.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      include: { incident: { select: { id: true, title: true, severity: true } } },
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch telemetry" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`post-telemetry-${ip}`, 150, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const rawBody = await req.json();
    const parseResult = TelemetryInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid telemetry payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const body: TelemetryInput = {
      entityId: data.hostname || "UNKNOWN-NODE",
      sourceType: (data.sourceType.includes("NETWORK") ? "NETWORK" : data.sourceType.includes("AUTH") ? "AUTH" : "SYSTEM") as any,
      sourceIp: data.sourceIp,
      destIp: data.destIp,
      port: data.port,
      protocol: data.protocol,
      username: data.username,
      hostname: data.hostname,
      processName: data.processName,
      action: data.action,
      bytesOut: data.bytesTransferred,
      dnsQuery: data.dnsQuery,
      payloadSnippet: data.payloadSnippet,
      timestamp: new Date(),
    };

    const rule = await getOrCreateDetectionRule();
    const settings = await prisma.securitySetting.findFirst();
    const isAutonomous = settings?.autonomousMode ?? true;

    const evalResult = evaluateTelemetry(
      body,
      { wZ: rule.wZNorm, wEntropy: rule.wEntropy, wSeq: rule.wSequence, wIntel: rule.wIntel },
      rule.suppressionFactor
    );

    const createdEvent = await prisma.telemetryEvent.create({
      data: {
        sourceType: data.sourceType,
        sourceIp: data.sourceIp || null,
        destIp: data.destIp || null,
        port: data.port || null,
        protocol: data.protocol || "TCP",
        username: data.username || null,
        hostname: data.hostname || null,
        processName: data.processName || null,
        action: data.action,
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
        details: JSON.stringify({ payload: data.payloadSnippet, dns: data.dnsQuery }),
      },
    });

    let triggeredActions: any[] = [];

    if (evalResult.confidence >= (settings?.minConfidenceForAction || 0.75) && !evalResult.isBenign) {
      const policyActions = determinePolicyActions(
        evalResult.severityBand === "BENIGN" ? "LOW" : evalResult.severityBand,
        data.action,
        data.hostname,
        data.sourceIp,
        data.username
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
    return NextResponse.json({ error: "Failed to ingest telemetry" }, { status: 500 });
  }
}
