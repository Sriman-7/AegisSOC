import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SCENARIOS } from "@/lib/cyber/scenarios";
import { evaluateTelemetry, calculateIncidentSeverity } from "@/lib/cyber/engine";
import { calculateBlastRadius } from "@/lib/cyber/correlator";
import { getOrCreateDetectionRule } from "@/lib/cyber/continuous-learning";
import { determinePolicyActions, executeDefenseAction } from "@/lib/cyber/response-orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scenarioKey = (body.scenarioKey || "C") as "A" | "B" | "C" | "D" | "E" | "F";
    const sc = SCENARIOS[scenarioKey];

    if (!sc) {
      return NextResponse.json({ error: `Unknown scenario key ${scenarioKey}` }, { status: 400 });
    }

    const rule = await getOrCreateDetectionRule();
    const settings = await prisma.securitySetting.findFirst();
    const isAutonomous = settings?.autonomousMode ?? true;

    const emittedEvents: any[] = [];
    const triggeredActions: any[] = [];

    // Evaluate each telemetry item in the scenario
    const evals = sc.telemetryStream.map((t) =>
      evaluateTelemetry(
        t,
        { wZ: rule.wZNorm, wEntropy: rule.wEntropy, wSeq: rule.wSequence, wIntel: rule.wIntel },
        rule.suppressionFactor
      )
    );

    const maxConf = Math.max(...evals.map((e) => e.confidence));
    const isAttack = sc.category === "ATTACK";

    let incident: any = null;

    if (isAttack) {
      const blastRadius = calculateBlastRadius(sc.affectedAssets.length);
      const critLevel = scenarioKey === "C" || scenarioKey === "A" ? "CRITICAL" : "HIGH";

      const { severityScore, severityLevel } = calculateIncidentSeverity(
        maxConf,
        critLevel,
        blastRadius,
        sc.cvssBaseScore,
        0.95
      );

      const attackSequence = sc.telemetryStream.map((t, idx) => ({
        step: idx + 1,
        timestamp: new Date().toISOString(),
        phase: sc.mitreTechniques[idx]?.tactic || "Execution",
        techniqueId: sc.mitreTechniques[idx]?.id || "T1059",
        techniqueName: sc.mitreTechniques[idx]?.name || "Command Interpreter",
        source: t.sourceIp || "External",
        target: t.destIp || t.hostname || "Internal",
        description: t.action.replace(/_/g, " "),
        evidence: t.payloadSnippet || `${t.bytesOut || 1200} bytes`,
        anomalyScore: evals[idx].anomalyScore,
      }));

      const iocs = [
        { type: "IPv4", value: sc.telemetryStream[0]?.sourceIp || "185.220.101.5", reputation: "MALICIOUS", firstSeen: "Just now", context: "Ingress Origin Node" },
      ];
      if (sc.telemetryStream[1]?.destIp) {
        iocs.push({ type: "IPv4", value: sc.telemetryStream[1].destIp, reputation: "MALICIOUS", firstSeen: "Just now", context: "Outbound C2 Listener" });
      }

      const aiReasoning = JSON.stringify({
        whyFlagged: [
          `Simulated attack detected with confidence ${(maxConf * 100).toFixed(0)}%.`,
          `Correlated with MITRE ATT&CK ${sc.mitreTechniques[0]?.id || "T1078"} (${sc.mitreTechniques[0]?.name || "Valid Accounts"}).`,
          `Immediate blast radius risk of ${blastRadius}% across target assets: [${sc.affectedAssets.join(", ")}].`,
        ],
        observableEvidence: [
          `Execution of ${sc.telemetryStream[0]?.action} on ${sc.telemetryStream[0]?.hostname}.`,
          `Volumetric departure of ${sc.telemetryStream[0]?.bytesOut || 1500} bytes.`,
        ],
        correlatedSignals: [
          `Telemetry linked to campaign attributed to ${sc.threatActor}.`,
        ],
        confidenceFactors: [
          { factor: "Z-Score Surge", scoreImpact: 0.35 },
          { factor: "MITRE Alignment", scoreImpact: 0.25 },
          { factor: "Context Multiplier", scoreImpact: 0.20 },
          { factor: "Threat Intel", scoreImpact: 0.20 },
        ],
        threatActorHypothesis: `Activity attributed to ${sc.threatActor}. Attack objective is ${sc.summary}.`,
        recommendedImmediateAction: `Execute autonomous containment on ${sc.affectedAssets[0]}.`,
      });

      incident = await prisma.securityIncident.create({
        data: {
          title: `[SIMULATED] ${sc.title}`,
          description: sc.summary,
          severity: severityLevel,
          status: "OPEN",
          attackType: sc.threatActor ? `${sc.title.split(" ")[0]} Attack` : "Simulated Threat",
          attackPhase: sc.mitreTechniques[sc.mitreTechniques.length - 1]?.tactic || "Execution",
          confidence: maxConf,
          riskScore: severityScore,
          blastRadius,
          affectedAssets: JSON.stringify(sc.affectedAssets),
          attackSequence: JSON.stringify(attackSequence),
          mitreTechniques: JSON.stringify(sc.mitreTechniques.map((m) => m.id)),
          iocs: JSON.stringify(iocs),
          aiReasoning,
          recommendedActions: JSON.stringify([sc.recommendedAction, "ROTATE_CREDENTIALS"]),
          isAutonomousMitigated: false,
          scenarioKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Trigger defense actions
      if (sc.recommendedAction && sc.recommendedAction !== "LOG_AND_MONITOR") {
        const actionType = sc.recommendedAction as any;
        const target = actionType === "ISOLATE_HOST" ? sc.affectedAssets[0] : (sc.telemetryStream[0]?.sourceIp || sc.affectedAssets[0]);
        const act = await executeDefenseAction(
          actionType,
          target,
          incident.id,
          `Autonomous response triggered for ${sc.title} (Confidence: ${(maxConf * 100).toFixed(0)}%)`,
          isAutonomous
        );
        triggeredActions.push(act);

        if (isAutonomous) {
          await prisma.securityIncident.update({
            where: { id: incident.id },
            data: { isAutonomousMitigated: true, status: "MITIGATED" },
          });
        }
      }
    }

    // Persist telemetry events
    for (let i = 0; i < sc.telemetryStream.length; i++) {
      const t = sc.telemetryStream[i];
      const ev = evals[i];
      const evRecord = await prisma.telemetryEvent.create({
        data: {
          timestamp: new Date(),
          sourceType: t.sourceType,
          sourceIp: t.sourceIp || null,
          destIp: t.destIp || null,
          port: t.port || null,
          protocol: t.protocol || "TCP",
          username: t.username || null,
          hostname: t.hostname || null,
          processName: t.processName || null,
          action: t.action,
          status: ev.isBenign ? "ALLOW" : ev.severityBand === "CRITICAL" ? "BLOCK" : "ANOMALOUS",
          anomalyScore: ev.anomalyScore,
          confidence: ev.confidence,
          isAnomaly: ev.isAnomaly,
          isBenign: ev.isBenign,
          zNorm: ev.zNorm,
          entropyDrift: ev.entropyDrift,
          sequenceRisk: ev.sequenceRisk,
          intelMatch: ev.intelMatch,
          contextMultiplier: ev.contextMultiplier,
          reasons: JSON.stringify(ev.reasons),
          details: JSON.stringify({ payload: t.payloadSnippet, dns: t.dnsQuery }),
          incidentId: incident?.id || null,
        },
      });
      emittedEvents.push(evRecord);
    }

    return NextResponse.json({
      success: true,
      scenario: sc,
      isAttack,
      maxConfidence: maxConf,
      incident,
      emittedEvents,
      triggeredActions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Simulation failed" }, { status: 500 });
  }
}
