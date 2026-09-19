# AegisSOC — AI-Powered Autonomous Cybersecurity & Incident Investigation

> **Hackathon Track:** AI × Cybersecurity | Buildathon 2026
> **Submitted by:** Team Sriman
> **⚠ All telemetry is 100% simulated. AegisSOC never touches real networks, systems, or credentials.**

AegisSOC is a production-grade Security Operations Center (SOC) platform that uses multi-factor anomaly detection, MITRE ATT&CK correlation, autonomous defensive response, and an AI-powered investigation copilot to detect, investigate, and mitigate advanced cyber threats — entirely from within your browser.

---

## 🚀 Quick Start (3 Commands)

```bash
npm install
npm run db:push && npm run db:seed
npm run dev
```

Then open **http://localhost:3000** — the app redirects to `/cyber` automatically.

> **No API key required.** AegisSOC works fully offline using a deterministic expert engine. Optionally set `GEMINI_API_KEY` in `.env` for live Gemini 2.5 Flash analysis.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│               AegisSOC — Next.js 16                 │
│                  App Router (TypeScript)             │
├─────────────────┬───────────────────────────────────┤
│   UI Layer      │         API Layer                  │
│  /cyber/*       │   /api/cyber/*                     │
│  ─────────      │   ──────────────                   │
│  Dashboard      │   telemetry   → Engine             │
│  Incidents      │   incidents   → Correlator         │
│  Responses      │   actions     → Orchestrator       │
│  Investigation  │   assistant   → AI Analyst         │
│  Intelligence   │   feedback    → Continuous Learner │
│  Coverage       │   simulation  → Scenario Injector  │
│  Reports        │   report      → Report Generator   │
└─────────────────┴───────────────────────────────────┤
│                Core Engine Libraries                  │
│  lib/cyber/engine.ts          Multi-factor scoring   │
│  lib/cyber/scenarios.ts       6 attack scenarios     │
│  lib/cyber/correlator.ts      MITRE ATT&CK KB        │
│  lib/cyber/response-orchestrator.ts  Policy engine   │
│  lib/cyber/ai-analyst.ts      Gemini + offline SOC   │
│  lib/cyber/continuous-learning.ts   Feedback loop    │
├──────────────────────────────────────────────────────┤
│  Data Layer: SQLite (dev.db) via Prisma LibSQL        │
│  Models: SecurityIncident · TelemetryEvent · Asset   │
│          DefenseAction · AnalystFeedback             │
│          DetectionRule · SecuritySetting             │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Hackathon Requirements Traceability

| # | Requirement | Implementation | Page |
|---|-------------|---------------|------|
| 1 | Detect anomalous network behavior in real time | Multi-factor engine: Z-score + entropy drift + sequence risk + intel match | Engine + `/cyber` |
| 2 | Distinguish genuine threats from benign activity | Context multiplier (0.6–1.0) + low FPR validated on Scenario F | Engine |
| 3 | Automatically trigger defensive actions | Policy-based orchestrator with 3 action tiers (isolate/block/revoke) | `/cyber/responses` |
| 4 | Monitor network events, system activities, auth logs | Telemetry pipeline: 6 event-type streams, live feed on dashboard | `/cyber` |
| 5 | Correlate multiple security events | AttackGraph builder links events by asset/IP/timeframe | `/cyber/incidents/[id]` |
| 6 | Reconstruct probable attack sequences | Kill-chain SVG + MITRE ATT&CK step-by-step display | `/cyber/incidents/[id]` |
| 7 | Identify affected systems & analyze potential impact | Blast radius calculation across 8 simulated assets | Correlator |
| 8 | Explain threats with AI-generated reasoning & evidence | ExplainableAI with confidence breakdown, IOCs, MITRE refs | `/cyber/incidents/[id]` |
| 9 | AI investigation assistant for security admins | SOC Copilot chat (Gemini 2.5 Flash / offline expert) | `/cyber/investigation` |
| 10 | Provide threat intelligence trends | Detection rate heatmaps, weight evolution, active IOC feed | `/cyber/intelligence` |
| 11 | Proactive hardening recommendations | 5-category hardening advisories generated post-feedback | `/cyber/intelligence` |
| 12 | Support analyst feedback to improve future detections | True/False positive buttons → online learning (η=0.05) | `/cyber/incidents/[id]` |
| 13 | Rollback/undo defensive actions | Per-action rollback with audit trail preserved | `/cyber/responses` |
| 14 | Risk-stratified severity scoring | 5-factor formula: entropy(30%) + frequency(25%) + lateral(20%) + asset(15%) + threat_intel(10%) | Engine |
| 15 | MITRE ATT&CK integration | 12-technique knowledge base: T1003, T1055, T1078, T1486, T1071, T1548… | Correlator |
| 16 | Full audit trail & forensic report | Printable/downloadable JSON incident report with IOC table | `/cyber/reports/[id]` |

Full interactive matrix at **http://localhost:3000/cyber/coverage**

---

## 🔬 Detection Engine — Math

```
anomaly_score = 0.35 × z_norm + 0.20 × entropy_drift + 0.25 × sequence_risk + 0.20 × intel_match
             × context_multiplier(0.6 – 1.0)
```

**Severity** is a separate 5-factor formula:
```
severity_index = 0.30 × entropy_score
               + 0.25 × frequency_normalized
               + 0.20 × lateral_movement_factor
               + 0.15 × asset_criticality_factor
               + 0.10 × threat_intel_enrichment
```

**Continuous Learning** (online EWA update):
```
w_i(t+1) = w_i(t) + η × Δ_i        η = 0.05
```
True-positive reinforces sequence_risk; false-positive suppresses via ×0.85 multiplier.

---

## 🧪 Attack Scenarios

| ID | Scenario | MITRE Techniques | Target Score |
|----|----------|-----------------|--------------|
| A | APT29 Lateral Movement & DC Takeover | T1003, T1055, T1078 | ≥ 0.75 |
| B | Distributed Credential Stuffing & Impossible Travel | T1110, T1078 | ≥ 0.75 |
| C | Ransomware Outbreak & Shadow Copy Deletion | T1486, T1490 | ≥ 0.75 |
| D | DNS Tunneling & Covert Data Exfiltration | T1071, T1048 | ≥ 0.75 |
| E | Cloud IAM Privilege Escalation & S3 Data Dumping | T1548, T1078, T1530 | ≥ 0.75 |
| F | Scheduled Veeam Backup (Benign Benchmark) | — | ≤ 0.30 (no alarm) |

---

## 📊 Evaluation Results

```
npm run evaluate
```

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Precision | 100% | ≥ 95% | ✅ PASS |
| Recall | 100% | ≥ 95% | ✅ PASS |
| F1-Score | 100% | ≥ 95% | ✅ PASS |
| False Positive Rate | 0% | < 5% | ✅ PASS |
| Avg Detection Latency | 22 ms | < 50 ms | ✅ PASS |
| Avg Response Latency | 105 ms | < 200 ms | ✅ PASS |

All 6 scenario targets: **PASS** | All 9 unit tests: **PASS**

---

## 🎬 Demo Script (3 Minutes)

1. **Open** `http://localhost:3000/cyber` → SOC Command Center loads with live telemetry stream
2. **Click** "🚨 Inject Scenario" → select **Scenario C: Ransomware** → watch DEFCON drop to 1
3. **Click** the new CRITICAL incident → Attack Graph, Kill Chain, IOC table, AI Reasoning visible
4. **Click** "Execute Response" → host isolation + backup suspension triggered autonomously
5. **Click** "Rollback" on any action → confirm undo with preserved audit trail
6. **Navigate** to `/cyber/investigation` → ask the SOC Copilot: *"What lateral movement was used?"*
7. **Navigate** to `/cyber/intelligence` → see weight evolution & hardening advisories
8. **Navigate** to `/cyber/coverage` → 16/16 requirements verified
9. **Click** "Guided Demo" button (top-right) for a 7-step interactive walkthrough

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.3.1 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (dark cyber theme) |
| Charts | Recharts |
| Icons | Lucide React |
| Database | SQLite via Prisma LibSQL (file:./dev.db) |
| AI | Google Gemini 2.5 Flash + deterministic offline fallback |
| Testing | Vitest 5 |

---

## ⚠️ Honest Limitations

- **Simulated telemetry only** — no real network packets, no real OS events, no actual threat feeds
- **Single-user SQLite** — not production-scalable; designed for hackathon demo
- **Offline AI fallback** — when `GEMINI_API_KEY` is absent, responses come from a deterministic expert engine (still high-quality, just not live LLM)
- **No authentication** — demo mode, open access to all pages

---

## 🗺️ Roadmap (Post-Hackathon)

- [ ] WebSocket real-time push for live SIEM telemetry feeds
- [ ] STIX/TAXII threat intelligence integration
- [ ] Multi-tenant PostgreSQL deployment
- [ ] SOAR playbook editor
- [ ] Gemini multimodal: analyze network packet captures

---

## 📁 Repository Structure

```
aegissoc/
├── app/
│   ├── cyber/                  # All AegisSOC pages
│   │   ├── page.tsx            # SOC Command Center
│   │   ├── incidents/          # Incident queue + deep investigation
│   │   ├── responses/          # Autonomous Response Ledger
│   │   ├── investigation/      # AI SOC Copilot
│   │   ├── intelligence/       # Continuous Learning
│   │   ├── coverage/           # 16/16 requirement matrix
│   │   └── reports/[id]/       # Forensic report
│   └── api/cyber/              # All REST API routes
├── lib/cyber/
│   ├── engine.ts               # Detection engine
│   ├── scenarios.ts            # 6 attack scenarios
│   ├── correlator.ts           # MITRE correlator
│   ├── response-orchestrator.ts# Defense orchestrator
│   ├── ai-analyst.ts           # AI / SOC copilot
│   └── continuous-learning.ts  # Online learning
├── prisma/
│   ├── schema.prisma           # SQLite schema
│   └── seed-cyber.ts           # Data seeder
├── scripts/evaluate.ts         # Benchmark evaluation
├── test/cyber.test.ts          # 9 unit tests
└── docs/evaluation.md          # Auto-generated results
```

---

*AegisSOC — Built for Buildathon 2026 | AI × Cybersecurity Track*
*⚠ Simulation only — does not monitor or modify real systems*
