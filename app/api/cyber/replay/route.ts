import { NextRequest, NextResponse } from "next/server";
import { evaluateTelemetry } from "@/lib/cyber/engine";
import { getOrCreateDetectionRule } from "@/lib/cyber/continuous-learning";
import { checkRateLimit } from "@/lib/cyber/rate-limiter";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`replay-${ip}`, 30, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await req.json();
    const events = Array.isArray(body) ? body : body.events || [];

    if (events.length === 0) {
      return NextResponse.json({ error: "No events supplied for replay" }, { status: 400 });
    }

    const rule = await getOrCreateDetectionRule();
    const results = [];

    for (const raw of events.slice(0, 50)) {
      const evalRes = evaluateTelemetry(
        {
          entityId: raw.hostname || "REPLAY-NODE",
          sourceType: raw.sourceType || "NETWORK",
          action: raw.action || "Log_Replay_Event",
          sourceIp: raw.sourceIp || "10.0.0.1",
          destIp: raw.destIp,
          hostname: raw.hostname,
          username: raw.username,
          dnsQuery: raw.dnsQuery,
          payloadSnippet: raw.payloadSnippet,
        },
        { wZ: rule.wZNorm, wEntropy: rule.wEntropy, wSeq: rule.wSequence, wIntel: rule.wIntel },
        rule.suppressionFactor
      );

      const dbEvt = await prisma.telemetryEvent.create({
        data: {
          sourceType: raw.sourceType || "NETWORK",
          sourceIp: raw.sourceIp || null,
          destIp: raw.destIp || null,
          action: raw.action || "Log_Replay_Event",
          hostname: raw.hostname || null,
          username: raw.username || null,
          status: evalRes.isBenign ? "ALLOW" : evalRes.severityBand === "CRITICAL" ? "BLOCK" : "ANOMALOUS",
          anomalyScore: evalRes.anomalyScore,
          confidence: evalRes.confidence,
          isAnomaly: evalRes.isAnomaly,
          isBenign: evalRes.isBenign,
          zNorm: evalRes.zNorm,
          entropyDrift: evalRes.entropyDrift,
          sequenceRisk: evalRes.sequenceRisk,
          intelMatch: evalRes.intelMatch,
          reasons: JSON.stringify(evalRes.reasons),
        },
      });

      results.push({
        id: dbEvt.id,
        action: raw.action,
        confidence: evalRes.confidence,
        severity: evalRes.severityBand,
        isAnomaly: evalRes.isAnomaly,
      });
    }

    return NextResponse.json({
      success: true,
      replayedCount: results.length,
      anomaliesDetected: results.filter((r) => r.isAnomaly).length,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to process log replay" }, { status: 500 });
  }
}
