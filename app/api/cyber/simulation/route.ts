import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SCENARIOS } from "@/lib/cyber/scenarios";
import { evaluateTelemetry } from "@/lib/cyber/engine";
import { getOrCreateDetectionRule } from "@/lib/cyber/continuous-learning";
import { determinePolicyActions, executeDefenseAction } from "@/lib/cyber/response-orchestrator";
import { SimulationInputSchema } from "@/lib/cyber/validation";
import { checkRateLimit } from "@/lib/cyber/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`sim-${ip}`, 60, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const rawBody = await req.json();
    const parseResult = SimulationInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid simulation scenario payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { scenarioKey, executeAutonomousAction = true } = parseResult.data;
    const scenario = SCENARIOS[scenarioKey];

    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const rule = await getOrCreateDetectionRule();
    const weights = {
      wZ: rule.wZNorm,
      wEntropy: rule.wEntropy,
      wSeq: rule.wSequence,
      wIntel: rule.wIntel,
    };

    let highestConfidence = 0;
    let worstSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "BENIGN" = "BENIGN";
    const createdEvents = [];

    // Evaluate all events in the scenario
    for (const rawEvt of scenario.telemetryStream) {
      const evalRes = evaluateTelemetry(rawEvt, weights, rule.suppressionFactor);
      if (evalRes.confidence > highestConfidence) highestConfidence = evalRes.confidence;

      if (evalRes.severityBand === "CRITICAL") worstSeverity = "CRITICAL";
      else if (evalRes.severityBand === "HIGH" && worstSeverity !== "CRITICAL") worstSeverity = "HIGH";
      else if (evalRes.severityBand === "MEDIUM" && !["CRITICAL", "HIGH"].includes(worstSeverity)) worstSeverity = "MEDIUM";

      const dbEvt = await prisma.telemetryEvent.create({
        data: {
          sourceType: rawEvt.sourceType,
          sourceIp: rawEvt.sourceIp || null,
          destIp: rawEvt.destIp || null,
          port: rawEvt.port || null,
          protocol: rawEvt.protocol || "TCP",
          username: rawEvt.username || null,
          hostname: rawEvt.hostname || null,
          processName: rawEvt.processName || null,
          action: rawEvt.action,
          status: evalRes.isBenign ? "ALLOW" : evalRes.severityBand === "CRITICAL" ? "BLOCK" : "ANOMALOUS",
          anomalyScore: evalRes.anomalyScore,
          confidence: evalRes.confidence,
          isAnomaly: evalRes.isAnomaly,
          isBenign: evalRes.isBenign,
          zNorm: evalRes.zNorm,
          entropyDrift: evalRes.entropyDrift,
          sequenceRisk: evalRes.sequenceRisk,
          intelMatch: evalRes.intelMatch,
          contextMultiplier: evalRes.contextMultiplier,
          reasons: JSON.stringify(evalRes.reasons),
          details: JSON.stringify({ payload: rawEvt.payloadSnippet, dns: rawEvt.dnsQuery }),
        },
      });
      createdEvents.push(dbEvt);
    }

    // If it's an attack scenario and breached threshold -> create incident + trigger defense
    let createdIncident = null;
    let triggeredActions: any[] = [];

    if (scenario.category === "ATTACK" && highestConfidence >= 0.75) {
      createdIncident = await prisma.securityIncident.create({
        data: {
          title: scenario.title,
          description: scenario.summary,
          severity: worstSeverity === "BENIGN" ? "HIGH" : worstSeverity,
          status: "ACTIVE",
          attackType: scenario.title.split(" ")[0] || "Custom Attack",
          confidence: highestConfidence,
          affectedAssets: JSON.stringify(scenario.affectedAssets),
          mitreTechniques: JSON.stringify(scenario.mitreTechniques.map(m => m.id)),
          rootCause: `Simulated injection of ${scenario.title} correlated across ${createdEvents.length} telemetry streams.`,
          blastRadius: worstSeverity === "CRITICAL" ? 85 : 50,
          isAutonomousMitigated: false,
        },
      });

      // Link events to incident
      for (const ev of createdEvents) {
        await prisma.telemetryEvent.update({
          where: { id: ev.id },
          data: { incidentId: createdIncident.id },
        });
      }

      if (executeAutonomousAction) {
        const primaryEv = scenario.telemetryStream[scenario.telemetryStream.length - 1];
        const policies = determinePolicyActions(
          worstSeverity === "BENIGN" ? "HIGH" : worstSeverity,
          primaryEv.action,
          primaryEv.hostname,
          primaryEv.sourceIp,
          primaryEv.username
        );

        for (const p of policies) {
          const act = await executeDefenseAction(
            p.actionType,
            p.target,
            createdIncident.id,
            `[Autonomous Response] ${p.reason}`,
            true
          );
          triggeredActions.push(act);
        }

        if (triggeredActions.length > 0) {
          await prisma.securityIncident.update({
            where: { id: createdIncident.id },
            data: { isAutonomousMitigated: true, status: "CONTAINED" },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      scenario: scenario.title,
      confidence: highestConfidence,
      eventsIngested: createdEvents.length,
      incident: createdIncident,
      triggeredActions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to run simulation" }, { status: 500 });
  }
}
