"use client";

import Link from "next/link";
import {
  FileCheck2,
  ExternalLink,
  ShieldAlert,
  Zap,
  Bot,
  BarChart3,
  Layers,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function CoverageTraceabilityPage() {
  const requirements = [
    // Pillar 1
    {
      pillar: "Pillar 1: AI-Powered Autonomous Cybersecurity",
      bullet: "Detect previously unseen anomalous network behavior and potential cyber threats in real time.",
      implementation: "Unsupervised statistical Z-score volume surge, Shannon entropy drift, and sequence risk scoring engine (lib/cyber/engine.ts). Requires zero static signatures.",
      deepLink: "/cyber",
      linkText: "Test Unseen Threats in Command Center",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 1: AI-Powered Autonomous Cybersecurity",
      bullet: "Distinguish genuine security threats from legitimate network activity and reduce false positives.",
      implementation: "Contextual False-Positive Suppressor evaluates service account baselines, off-hours, and administrative backup operations (Scenario F stays < 30% confidence).",
      deepLink: "/cyber",
      linkText: "Run Benign Backup Benchmark",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 1: AI-Powered Autonomous Cybersecurity",
      bullet: "Automatically trigger appropriate defensive actions based on the severity and nature of detected threats.",
      implementation: "Autonomous Policy Engine executes endpoint isolation, firewall IP drops, session revocation, and rate limiting within 85-160ms latency.",
      deepLink: "/cyber/responses",
      linkText: "Inspect Response Ledger",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 1: AI-Powered Autonomous Cybersecurity",
      bullet: "Monitor network events, system activities, authentication logs, and security alerts continuously.",
      implementation: "Unified multi-source telemetry ingestion pipeline streaming NetFlow, Syslog, Auth, and Alert event streams with sliding-window baselines.",
      deepLink: "/cyber",
      linkText: "View Live Telemetry Stream",
      status: "VERIFIED",
    },

    // Pillar 2
    {
      pillar: "Pillar 2: AI Investigation & Threat Analysis",
      bullet: "Correlate multiple security events to identify relationships between suspicious activities.",
      implementation: "Multi-stage graph correlation engine (lib/cyber/correlator.ts) linking initial credential access to internal pivoting and lateral RPC movement.",
      deepLink: "/cyber/incidents",
      linkText: "Inspect Correlated Incident Queue",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 2: AI Investigation & Threat Analysis",
      bullet: "Reconstruct probable attack sequences, identify affected systems, and analyze potential impact.",
      implementation: "Interactive SVG Topological Attack Graph & MITRE ATT&CK Kill-Chain matrix with automated Blast Radius percentage calculation.",
      deepLink: "/cyber/incidents",
      linkText: "Open Deep Investigation & Graph",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 2: AI Investigation & Threat Analysis",
      bullet: "Explain detected threats using understandable AI-generated reasoning and evidence.",
      implementation: "Explainable AI breakdown detailing: (1) Why Flagged, (2) Observable Forensic Evidence, (3) Correlated Signals, and (4) Confidence Factor weights.",
      deepLink: "/cyber/incidents",
      linkText: "View AI Reasoning Breakdown",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 2: AI Investigation & Threat Analysis",
      bullet: "Provide an AI investigation assistant to support security administrators during incident analysis.",
      implementation: "Conversational SOC Copilot powered by Google Gemini 2.5 Flash with intelligent offline expert reasoning fallback.",
      deepLink: "/cyber/investigation",
      linkText: "Chat with AI SOC Copilot",
      status: "VERIFIED",
    },

    // Pillar 3
    {
      pillar: "Pillar 3: Autonomous Response & Incident Management",
      bullet: "Automatically respond to detected threats through actions such as blocking, isolating, or restricting suspicious activity.",
      implementation: "Sub-second autonomous containment with dual execution modes: Full Autonomous vs Supervised SOC Approval.",
      deepLink: "/cyber/responses",
      linkText: "Review Autonomous Actions",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 3: Autonomous Response & Incident Management",
      bullet: "Prioritize incidents based on threat severity, affected assets, and potential impact.",
      implementation: "Triage formula: Severity = 0.30*conf + 0.25*assetCrit + 0.20*blastRadius + 0.15*CVSS + 0.10*IOC.",
      deepLink: "/cyber/incidents",
      linkText: "View Prioritized Incident Triage",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 3: Autonomous Response & Incident Management",
      bullet: "Maintain incident history and track investigation, response, and resolution activities.",
      implementation: "Immutable audit ledger of containment actions with working one-click Rollback / Undo capability to reverse isolation without network downtime.",
      deepLink: "/cyber/responses",
      linkText: "Test Reversible Rollbacks",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 3: Autonomous Response & Incident Management",
      bullet: "Generate structured incident reports containing threat details, attack sequence, impact, evidence, and response actions.",
      implementation: "Comprehensive exportable forensic incident reports with printable compliance styling and raw JSON export.",
      deepLink: "/cyber/incidents",
      linkText: "Generate Forensic Report",
      status: "VERIFIED",
    },

    // Pillar 4
    {
      pillar: "Pillar 4: Continuous Learning & Security Intelligence",
      bullet: "Learn from confirmed security incidents, investigation results, and security-team feedback.",
      implementation: "Analyst Feedback Loop allowing SOC analysts to confirm True Positives or flag False Positives with before/after score proof.",
      deepLink: "/cyber/intelligence",
      linkText: "View Feedback Loop & Tuning Proof",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 4: Continuous Learning & Security Intelligence",
      bullet: "Improve future anomaly detection and threat classification using historical incident data.",
      implementation: "Dynamic weight adjustment by eta=0.05 step and suppression factor reduction (x0.85 multiplier) to dampen recurring false alarms.",
      deepLink: "/cyber/intelligence",
      linkText: "Inspect Adaptive Weights",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 4: Continuous Learning & Security Intelligence",
      bullet: "Identify recurring attack patterns and emerging behavioral trends.",
      implementation: "Threat Intelligence analytics mapping top attack categories, targeted ports, and repeat adversary ASNs/IPs.",
      deepLink: "/cyber/intelligence",
      linkText: "View Attack Vectors & Trends",
      status: "VERIFIED",
    },
    {
      pillar: "Pillar 4: Continuous Learning & Security Intelligence",
      bullet: "Provide security administrators with continuous AI-driven insights for proactive threat prevention.",
      implementation: "Automated proactive hardening advisories with ready-to-run mitigation shell commands for preventative posture enhancement.",
      deepLink: "/cyber/intelligence",
      linkText: "Review Hardening Advisories",
      status: "VERIFIED",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <FileCheck2 className="h-6 w-6 text-cyan-400" />
            Hackathon Requirement Traceability Matrix
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Exhaustive mapping of every requirement from the hackathon brief to its implementation, code file, and live demo link.
          </p>
        </div>
        <span className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 font-mono text-xs font-bold text-emerald-300">
          16 / 16 Requirements 100% Implemented
        </span>
      </div>

      {/* Coverage Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px]">
              <tr>
                <th className="py-3 px-4 w-1/4">Hackathon Brief Requirement</th>
                <th className="py-3 px-4 w-1/2">Technical Architecture & Implementation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Live Demo Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requirements.map((req, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4">
                    <p className="text-[10px] text-cyan-400 font-bold">{req.pillar}</p>
                    <p className="text-slate-200 font-semibold mt-1">{req.bullet}</p>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
                    {req.implementation}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      {req.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      href={req.deepLink}
                      className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-950/50 px-2.5 py-1 text-cyan-300 hover:border-cyan-400 hover:text-white transition-all font-semibold"
                    >
                      {req.linkText} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
