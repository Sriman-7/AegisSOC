# AegisSOC — AI Judge Demo & Evaluation Guide

**Track:** AI Powered Autonomous Cybersecurity & Incident Investigation (AI × Cybersecurity)  
**System:** AegisSOC Autonomous Cyber Defense Platform

---

## 🚀 1. Quick Start & Execution (Under 60 Seconds)

```bash
# 1. Install dependencies
npm install

# 2. Push SQLite Schema & Seed Realistic Simulation Data
npm run db:push && npm run db:seed

# 3. Start the Application
npm run dev
```

Open **http://localhost:3000** in your browser — it automatically redirects to `/cyber` (SOC Command Center).

---

## 🧪 2. Automated Benchmark & Unit Tests

Run the built-in test suites to verify math formulas, scenarios, and autonomous mitigation latencies:

```bash
# Run unit tests (9/9 passing)
npm test

# Run the full automated scenario benchmark (Scenarios A-F)
npm run evaluate
```

The benchmark outputs verified metrics to `docs/evaluation.md`:
- **Precision:** 100.0% (Target: >= 95%)
- **Recall:** 100.0% (Target: >= 95%)
- **F1-Score:** 100.0% (Target: >= 95%)
- **False Positive Rate:** 0.0% (Target: < 5%)
- **Mean Detection Latency:** 22 ms (Target: < 50 ms)
- **Mean Autonomous Response Latency:** 105 ms (Target: < 200 ms)

---

## 🎬 3. Fast 3-Minute Interactive Demo Script for Judges

1. **SOC Command Center (`/cyber`):**
   - Review live telemetry dynamics (Z-score anomaly curve vs. Flow Volume in kpps).
   - Review the 4 KPI cards: Total Incidents, Critical Threats, Autonomous Actions (105ms), and False Positive Suppression (35.2%).
2. **Inject a Cyber Attack:**
   - Click **"🚨 Inject Scenario"** and select **"Scenario C: Ransomware Outbreak"**.
   - Watch the DEFCON indicator shift to **DEFCON 1 (CRITICAL)** in real-time.
3. **Deep Incident Investigation (`/cyber/incidents`):**
   - Click the newly created incident.
   - Explore the **Attack Graph & Topology** showing the adversary path from ingress to the contained endpoint.
   - Switch to **Explainable AI Reasoning** to view confidence factor breakdown and threat actor hypotheses.
4. **Autonomous Response & Rollback (`/cyber/responses`):**
   - Inspect the immutable Defense Ledger recording automated host isolation and backup suspension.
   - Click **"Rollback"** on any action to observe instant 1-click safe undo.
5. **AI Investigation Assistant (`/cyber/investigation`):**
   - Engage with the Gemini-powered SOC Copilot. Click preset threat hunting queries like *"What lateral movement techniques were observed?"*.
6. **Continuous Learning (`/cyber/intelligence`):**
   - Inspect dynamic detection weights and proactive hardening recommendations.
7. **Requirements Traceability Matrix (`/cyber/coverage`):**
   - Verify 16/16 hackathon requirements with live status badges.

---

*Note: All telemetry is 100% simulated for ethical, safe demonstration.*
