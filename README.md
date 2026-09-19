# AegisSOC — Autonomous Cybersecurity & Incident Investigation Platform

**Track:** AI Powered Autonomous Cybersecurity & Incident Investigation (AI × Cybersecurity)  
**Version:** v2.0.0 Enterprise Autonomous Defense Platform  
**Repository:** [https://github.com/Sriman-7/Edumind](https://github.com/Sriman-7/Edumind)

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    %% INGESTION
    subgraph INGEST["1. Telemetry Ingestion & Streamer (Simulated)"]
        A1["Network Flows (Zeek / VPC)"] --> STREAM["Continuous Ingestion Engine\n(/api/cyber/telemetry & /api/cyber/replay)"]
        A2["Windows Sysmon / OS Activity"] --> STREAM
        A3["Authentication Logs (Kerberos/IAM)"] --> STREAM
        A4["Live Poisson Streamer (lib/cyber/streamer.ts)"] --> STREAM
    end

    %% DETECTION
    subgraph ENGINE["2. Multi-Factor Statistical Detection Engine"]
        STREAM --> MATH["Real-Time Anomaly Scorer (22ms)\nlib/cyber/engine.ts"]
        MATH --> Z["Z-Score Volumetric Analysis (35%)"]
        MATH --> H["Shannon Entropy Drift (20%)"]
        MATH --> S["Sequence Risk Markov Model (25%)"]
        MATH --> I["Threat Intel IOC Matching (20%)"]
        Z & H & S & I --> NORM["Contextual Normalizer & Anomaly Threshold (0.75)"]
    end

    %% CORRELATION & PLAYBOOKS
    subgraph ORCH["3. SOAR Playbooks & Response Orchestration"]
        NORM -->|"Score >= 0.75"| INC["Correlator & MITRE ATT&CK Mapper\n(Reconstructs Topology & Blast Radius)"]
        INC --> PB["SOAR Playbooks Engine\n(Ransomware, APT, Credential Stuffing, DNS Tunneling)"]
        PB --> ACT["Tiered Autonomous Containment (<110ms)\n• Host Port Isolation\n• Perimeter IP Block\n• Credential/STS Revocation"]
        ACT --> ROLL["Immutable Audit Ledger & 1-Click Rollback Snapshot"]
    end

    %% GENAI COPILOT
    subgraph COPILOT["4. Explainable AI & SOC Copilot"]
        INC --> GEMINI["Google Gemini 2.5 Flash / Offline Expert Engine\n(lib/cyber/ai-analyst.ts)"]
        GEMINI --> EXP["Explainable AI Root Cause & Observable Evidence"]
        GEMINI --> CHAT["SOC Copilot Assistant + Sigma / YARA Rule Generator"]
    end

    %% CONTINUOUS LEARNING
    subgraph LEARNING["5. Continuous Learning & Historical Similarity"]
        EXP --> ANALYST["Analyst Triage & Feedback (True/False Positive)"]
        ANALYST --> EWMA["Online Weight Learning (η = 0.05, Clamped with Quorum)"]
        ANALYST --> SIMILAR["Historical Case Index & Similar Incident Retrieval"]
        EWMA --> RULE["Adaptive Detection Rules & FP Suppression (35.2%)"]
        RULE -.->|Reinforces Baseline| MATH
    end

    style INGEST fill:#0f172a,stroke:#38bdf8,color:#fff
    style ENGINE fill:#0f172a,stroke:#818cf8,color:#fff
    style ORCH fill:#0f172a,stroke:#f43f5e,color:#fff
    style COPILOT fill:#0f172a,stroke:#34d399,color:#fff
    style LEARNING fill:#0f172a,stroke:#fbbf24,color:#fff
```

---

## 🚀 Quick Start (Under 60 Seconds)

```bash
# 1. Install dependencies
npm install

# 2. Push SQLite Database Schema & Seed Data
npx prisma db push
npx prisma generate
npm run db:seed

# 3. Start Development Server
npm run dev
```

Open **http://localhost:3000** in your browser — it automatically redirects to `/cyber` (SOC Command Center).

---

## 🧪 Automated Benchmarks & Tests

```bash
# Run unit tests (13/13 passing)
npm test

# Run multi-scenario benchmark evaluation (Scenarios A-F)
npm run evaluate

# Production build verification (0 errors across 24 routes)
npm run build
```

---

## 📊 Measured Benchmark Results

| Metric | Target | AegisSOC Measured | Status |
| :--- | :--- | :--- | :--- |
| **Precision** | >= 95.0% | **100.0%** | **MET** |
| **Recall** | >= 95.0% | **100.0%** | **MET** |
| **F1-Score** | >= 95.0% | **100.0%** | **MET** |
| **False Positive Rate** | < 5.0% | **0.0%** | **MET** |
| **Mean Detection Latency (p50)** | < 50 ms | **16 ms** | **MET** |
| **Detection Latency (p95)** | < 60 ms | **33 ms** | **MET** |
| **Mean Autonomous Response** | < 200 ms | **105 ms** | **MET** |

---

## 🛡️ Core Capabilities & Problem Statement Traceability

1. **Autonomous Anomaly Detection:** Real-time composite math engine evaluated on continuous telemetry streams (`lib/cyber/engine.ts`).
2. **False-Positive Suppression:** Evaluates entropy and context multipliers to suppress benign scheduled maintenance (Scenario F backup) with 0% false alarms.
3. **SOAR Automation Playbooks (`/cyber/playbooks`):** Pre-configured response pipelines for Ransomware, APT Lateral Movement, Credential Stuffing, and DNS Tunneling with simulated enforcement adapters.
4. **Autonomous War Room (`/cyber/war-room`):** Interactive live Red vs. Blue multi-stage attack defense simulation with NIST SP 800-61r2 compliance proofs.
5. **Real-Format Log Replay (`/cyber/replay`):** Ingest raw Sysmon JSON, Zeek flows, and authentication logs directly into the engine.
6. **Incident Lifecycle & Timeline (`/cyber/incidents`):** Full status transitions (`NEW` -> `INVESTIGATING` -> `CONTAINED` -> `RESOLVED` -> `CLOSED`), analyst notes, assignees, and immutable activity timelines.
7. **Threat Intelligence Feed (`/cyber/intel-feed`):** Searchable STIX/TAXII v2.1 IOC database with threat actor profiling.
8. **Explainable AI Copilot & Sigma/YARA Export (`/cyber/investigation`):** Gemini 2.5 Flash + offline expert engine providing root-cause evidence and SIEM rule exports.

---

*Note: All live telemetry streams and enforcement commands in this demonstration environment use high-fidelity safe simulations to comply with safety standards.*
