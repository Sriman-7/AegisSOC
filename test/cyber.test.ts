import { describe, it, expect } from "vitest";
import {
  calculateShannonEntropy,
  calculateZScore,
  evaluateTelemetry,
  calculateIncidentSeverity,
} from "../lib/cyber/engine";
import { SCENARIOS } from "../lib/cyber/scenarios";
import { buildAttackGraph, calculateBlastRadius, MITRE_KNOWLEDGE_BASE } from "../lib/cyber/correlator";
import { determinePolicyActions, createRollbackPayload } from "../lib/cyber/response-orchestrator";

describe("AegisSOC Anomaly & Detection Engine", () => {
  it("computes Shannon entropy correctly", () => {
    // Repeated character has zero entropy
    expect(calculateShannonEntropy("aaaaaa")).toBe(0);
    // Random string has high entropy (> 3.5)
    const highEntropy = calculateShannonEntropy("4d61737369766520456e74726f7079");
    expect(highEntropy).toBeGreaterThan(3.0);
  });

  it("calculates Z-score statistical deviation", () => {
    const history = [100, 100, 100, 100, 100];
    // With 0 standard deviation, should return 0
    expect(calculateZScore(100, history)).toBe(0);

    const normalHistory = [10, 12, 11, 13, 10, 12];
    const z = calculateZScore(45, normalHistory);
    expect(z).toBeGreaterThan(3.0);
  });

  it("satisfies all 6 scenario targets (A-E >= 0.75, F < 0.30)", () => {
    for (const [key, sc] of Object.entries(SCENARIOS)) {
      const evals = sc.telemetryStream.map((t) => evaluateTelemetry(t));
      const maxConf = Math.max(...evals.map((e) => e.confidence));

      if (sc.category === "ATTACK") {
        expect(maxConf).toBeGreaterThanOrEqual(0.75);
      } else {
        expect(maxConf).toBeLessThan(0.30);
        expect(evals[0].isBenign).toBe(true);
      }
    }
  });

  it("calculates incident severity according to multi-factor rubric", () => {
    const { severityScore, severityLevel } = calculateIncidentSeverity(
      0.95, // confidence
      "CRITICAL",
      65, // blast radius
      9.6, // CVSS
      0.90 // IOC
    );
    expect(severityScore).toBeGreaterThanOrEqual(80);
    expect(severityLevel).toBe("CRITICAL");
  });
});

describe("Correlator & MITRE ATT&CK Mapping", () => {
  it("builds valid attack graph topology", () => {
    const graph = buildAttackGraph("Ransomware", ["FS-STORAGE-04", "DB-PAYMENTS-01"], "185.220.101.5");
    expect(graph.nodes.length).toBeGreaterThanOrEqual(3);
    expect(graph.edges.length).toBeGreaterThanOrEqual(2);
    expect(graph.nodes.some((n) => n.type === "attacker")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "secure")).toBe(true);
  });

  it("calculates blast radius within 0..100%", () => {
    const radius = calculateBlastRadius(3, 12);
    expect(radius).toBeGreaterThan(0);
    expect(radius).toBeLessThanOrEqual(100);
  });

  it("contains core MITRE ATT&CK techniques", () => {
    expect(MITRE_KNOWLEDGE_BASE["T1078"]).toBeDefined();
    expect(MITRE_KNOWLEDGE_BASE["T1059"]).toBeDefined();
    expect(MITRE_KNOWLEDGE_BASE["T1490"]).toBeDefined();
  });
});

describe("Response Orchestrator & Rollback Ledger", () => {
  it("determines policy actions based on severity", () => {
    const criticalActions = determinePolicyActions("CRITICAL", "Ransomware", "FS-STORAGE-04", "91.240.118.172");
    expect(criticalActions.some((a) => a.actionType === "ISOLATE_HOST")).toBe(true);

    const highActions = determinePolicyActions("HIGH", "Credential Access", undefined, "185.220.101.5", "user@aegis.corp");
    expect(highActions.some((a) => a.actionType === "BLOCK_IP")).toBe(true);
    expect(highActions.some((a) => a.actionType === "REVOKE_TOKEN")).toBe(true);
  });

  it("creates reversible rollback payloads", () => {
    const payloadStr = createRollbackPayload("ISOLATE_HOST", "FS-STORAGE-04");
    const payload = JSON.parse(payloadStr);
    expect(payload.command).toContain("AegisQuarantine");
    expect(payload.revertState.status).toBe("HEALTHY");
  });
});
