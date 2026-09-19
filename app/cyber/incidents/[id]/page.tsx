"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  Bot,
  Zap,
  RotateCcw,
  CheckCircle2,
  FileText,
  Clock,
  Server,
  Layers,
  Send,
  Terminal,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"graph" | "sequence" | "reasoning" | "iocs" | "actions">("graph");
  const [feedbackSuccess, setFeedbackSuccess] = useState<any>(null);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  // Copilot chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "AegisSOC Investigation Assistant online. How can I assist your forensic analysis of this incident?",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const fetchIncident = async () => {
    try {
      const res = await fetch(`/api/cyber/incidents/${id}`);
      const json = await res.json();
      if (json?.incident) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleRollback = async (actionId: string) => {
    try {
      const res = await fetch(`/api/cyber/actions/${actionId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revertedBy: "SOC Analyst" }),
      });
      const result = await res.json();
      if (result.success) {
        setRollbackSuccess(result.message);
        await fetchIncident();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFeedback = async (verdict: "TRUE_POSITIVE" | "FALSE_POSITIVE") => {
    try {
      const res = await fetch("/api/cyber/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: id,
          verdict,
          analystNotes: `Analyst feedback recorded during deep triage.`,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedbackSuccess(result.feedback);
        await fetchIncident();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const askCopilot = async (questionText?: string) => {
    const query = questionText || inputQuery;
    if (!query) return;

    const newMsgs = [...chatMessages, { role: "user" as const, text: query }];
    setChatMessages(newMsgs);
    setInputQuery("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/cyber/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          context: {
            incidentTitle: data.incident.title,
            attackType: data.incident.attackType,
            severity: data.incident.severity,
            confidence: data.incident.confidence,
            affectedAssets: data.affectedAssets,
            iocs: data.iocs,
            actions: data.incident.actions.map((a: any) => `${a.actionType} (${a.status})`),
          },
        }),
      });
      const json = await res.json();
      setChatMessages([...newMsgs, { role: "assistant", text: json.answer || "No response generated." }]);
    } catch {
      setChatMessages([...newMsgs, { role: "assistant", text: "Error communicating with AI Copilot." }]);
    } finally {
      setIsAsking(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center font-mono text-cyan-400">
        Loading forensic incident graph and correlation timeline...
      </div>
    );
  }

  const { incident, attackGraph, attackSequence, mitreTechniques, iocs, aiReasoning } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Back Button & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <Link
          href="/cyber/incidents"
          className="flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Incident Queue
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/cyber/reports/${incident.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950/60 px-3 py-1.5 font-mono text-xs font-bold text-cyan-200 hover:bg-cyan-900"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" /> Export Forensic Report
          </Link>
        </div>
      </div>

      {/* Incident Header Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`rounded px-2.5 py-0.5 font-mono text-xs font-bold ${
                  incident.severity === "CRITICAL"
                    ? "bg-rose-950 border border-rose-800 text-rose-300"
                    : "bg-amber-950 border border-amber-800 text-amber-300"
                }`}
              >
                {incident.severity}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                {incident.attackType}
              </span>
              <span className="font-mono text-xs text-slate-400">
                Status: <strong className="text-cyan-400">{incident.status}</strong>
              </span>
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold text-slate-100">
              {incident.title}
            </h1>
            <p className="font-mono text-xs text-slate-400 max-w-4xl">
              {incident.description}
            </p>
          </div>

          {/* Severity & Confidence Gauge */}
          <div className="flex items-center gap-4 shrink-0 rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono">
            <div className="text-center">
              <p className="text-[10px] uppercase text-slate-500">AI Confidence</p>
              <p className="text-xl font-bold text-cyan-400">{(incident.confidence * 100).toFixed(0)}%</p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <p className="text-[10px] uppercase text-slate-500">Risk Score</p>
              <p className="text-xl font-bold text-rose-400">{incident.riskScore}/100</p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <p className="text-[10px] uppercase text-slate-500">Blast Radius</p>
              <p className="text-xl font-bold text-amber-400">{incident.blastRadius}%</p>
            </div>
          </div>
        </div>

        {/* Analyst Feedback Proof Banner */}
        {feedbackSuccess && (
          <div className="mt-4 rounded-lg border border-emerald-800/80 bg-emerald-950/30 p-3 font-mono text-xs text-emerald-200">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Continuous Learning Feedback Applied: {feedbackSuccess.verdict}
            </p>
            <p className="mt-1 text-[11px] opacity-90">
              {feedbackSuccess.tuningSummary}
            </p>
            <div className="mt-2 flex items-center gap-4 text-[11px]">
              <span>Before Confidence: <strong>{(feedbackSuccess.beforeConfidence * 100).toFixed(0)}%</strong></span>
              <span>→ After Score: <strong className="text-emerald-400">{(feedbackSuccess.afterConfidence * 100).toFixed(0)}%</strong></span>
              <span>Suppression Factor: <strong>{feedbackSuccess.suppressionFactor}</strong></span>
            </div>
          </div>
        )}

        {/* Rollback Notification Banner */}
        {rollbackSuccess && (
          <div className="mt-4 rounded-lg border border-cyan-800 bg-cyan-950/30 p-3 font-mono text-xs text-cyan-200 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-cyan-400" />
            {rollbackSuccess}
          </div>
        )}
      </div>

      {/* Navigation Tabs for Deep Investigation */}
      <div className="flex border-b border-slate-800 font-mono text-xs">
        {[
          { id: "graph", label: "Attack Graph & Topology" },
          { id: "sequence", label: "MITRE ATT&CK Kill-Chain" },
          { id: "reasoning", label: "Explainable AI Reasoning" },
          { id: "iocs", label: "Indicators of Compromise" },
          { id: "actions", label: "Defensive Actions & Rollback" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`border-b-2 px-4 py-2.5 font-semibold transition-all ${
              activeTab === t.id
                ? "border-cyan-400 text-cyan-300 bg-slate-900/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Interactive SVG Attack Graph */}
      {activeTab === "graph" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <h3 className="font-mono text-sm font-bold text-slate-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                Reconstructed Attack Graph & Asset Topology
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Topological visualization of the adversary's lateral traversal path and affected crown jewels.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Attacker / Compromised
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Isolated Endpoint
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /> Secure Asset
              </span>
            </div>
          </div>

          {/* Hand-built SVG Attack Graph Visualizer */}
          <div className="relative h-96 w-full rounded-lg border border-slate-800/80 bg-slate-950 p-4 flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 850 360">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
                </marker>
                <marker id="arrowhead-danger" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" />
                </marker>
              </defs>

              {/* Connecting Lines */}
              <line x1="120" y1="180" x2="310" y2="180" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead-danger)" className="animate-pulse" />
              <line x1="370" y1="180" x2="560" y2="130" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrowhead-danger)" />
              <line x1="370" y1="180" x2="560" y2="240" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrowhead)" />
              <line x1="620" y1="130" x2="750" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

              {/* Edge Labels */}
              <text x="210" y="165" fill="#f43f5e" fontSize="10" fontFamily="monospace" textAnchor="middle">Initial Access (T1078)</text>
              <text x="470" y="140" fill="#f43f5e" fontSize="10" fontFamily="monospace" textAnchor="middle">Lateral RPC (T1021)</text>
              <text x="470" y="235" fill="#06b6d4" fontSize="10" fontFamily="monospace" textAnchor="middle">C2 Beacon (T1071)</text>

              {/* Node 1: Attacker */}
              <g transform="translate(100, 180)">
                <circle r="36" fill="#881337" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="2" />
                <circle r="6" fill="#f43f5e" />
                <text y="-44" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Adversary Infrastructure</text>
                <text y="48" fill="#fda4af" fontSize="9" fontFamily="monospace" textAnchor="middle">185.220.101.5</text>
              </g>

              {/* Node 2: Pivot Host (WS-EXEC-01 or FS-STORAGE-04) */}
              <g transform="translate(340, 180)">
                <rect x="-48" y="-30" width="96" height="60" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                <text y="-8" fill="#e0e7ff" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {data.affectedAssets[0] || "WS-EXEC-01"}
                </text>
                <text y="10" fill="#a5b4fc" fontSize="9" fontFamily="monospace" textAnchor="middle">Initial Compromise</text>
                <text y="24" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">10.0.1.45</text>
              </g>

              {/* Node 3: Target Crown Jewel / Isolated Host */}
              <g transform="translate(590, 120)">
                <rect x="-52" y="-30" width="104" height="60" rx="8" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
                <text y="-8" fill="#fef3c7" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {data.affectedAssets[1] || "DC-CORP-PRIMARY"}
                </text>
                <text y="10" fill="#fde68a" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  ISOLATED (CONTAINED)
                </text>
                <text y="24" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">10.0.0.5</text>
              </g>

              {/* Node 4: Exfiltration Gateway */}
              <g transform="translate(590, 250)">
                <rect x="-50" y="-28" width="100" height="56" rx="8" fill="#082f49" stroke="#06b6d4" strokeWidth="1.5" />
                <text y="-6" fill="#e0f2fe" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">GW-AUTH-EXT</text>
                <text y="10" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">Egress Inspected</text>
                <text y="22" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">10.0.1.1</text>
              </g>

              {/* Node 5: Unaffected Vault */}
              <g transform="translate(770, 180)">
                <rect x="-44" y="-28" width="88" height="56" rx="8" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
                <text y="-6" fill="#d1fae5" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SECURE-VAULT</text>
                <text y="10" fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle">Zero Infiltration</text>
                <text y="22" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">10.0.99.1</text>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Tab 2: MITRE ATT&CK Kill-Chain Chronology */}
      {activeTab === "sequence" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-2.5">
            <h3 className="font-mono text-sm font-bold text-slate-200">
              Chronological Attack Progression & MITRE ATT&CK Mapping
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Reconstructed sequential execution trail mapped to standardized cybersecurity T-codes.
            </p>
          </div>

          <div className="space-y-3">
            {attackSequence.map((step: any) => (
              <div
                key={step.step}
                className="flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                  {step.step}
                </span>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-950 px-2 py-0.5 font-bold text-indigo-300">
                        {step.techniqueId}: {step.techniqueName}
                      </span>
                      <span className="text-slate-400 font-semibold">{step.phase}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-200">{step.description}</p>
                  <p className="text-[11px] text-cyan-400/90 font-semibold">
                    Evidence: {step.evidence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Explainable AI Reasoning */}
      {activeTab === "reasoning" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
          <div className="border-b border-slate-800 pb-2.5">
            <h3 className="font-mono text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Explainable AI Forensic Reasoning & Evidence
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Transparent breakdown explaining the mathematical detection logic, observable evidence, and confidence calculation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
              <h4 className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">Why Was This Flagged?</h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {aiReasoning?.whyFlagged?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
              <h4 className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">Observable Forensic Evidence</h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {aiReasoning?.observableEvidence?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">Correlated Attack Signals</h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {aiReasoning?.correlatedSignals?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
              <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Threat Actor Attribution</h4>
              <p className="text-slate-300">
                {aiReasoning?.threatActorHypothesis}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-300">
                <strong>Recommended Action: </strong>{aiReasoning?.recommendedImmediateAction}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Indicators of Compromise (IOCs) */}
      {activeTab === "iocs" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-2.5">
            <h3 className="font-mono text-sm font-bold text-slate-200">
              Verified Indicators of Compromise (IOCs)
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Observed adversary IPs, compromised accounts, and malicious indicators.
            </p>
          </div>

          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Indicator Value</th>
                <th className="py-2.5 px-3">Reputation</th>
                <th className="py-2.5 px-3">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {iocs.map((ioc: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{ioc.type}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-mono">{ioc.value}</td>
                  <td className="py-2.5 px-3">
                    <span className="rounded bg-rose-950 text-rose-300 px-1.5 py-0.5 text-[10px] font-bold">
                      {ioc.reputation}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{ioc.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Defensive Actions with Rollback */}
      {activeTab === "actions" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold text-slate-200 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Autonomous Defensive Containment & Rollback Ledger
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Every executed defensive mitigation can be immediately reversed with one click.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {incident.actions.map((act: any) => (
              <div
                key={act.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                        act.status === "EXECUTED"
                          ? "bg-cyan-950 border border-cyan-800 text-cyan-300"
                          : act.status === "REVERTED"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-amber-950 text-amber-300"
                      }`}
                    >
                      {act.status}
                    </span>
                    <span className="font-bold text-slate-200">
                      {act.actionType} on {act.target}
                    </span>
                    {act.latencyMs > 0 && (
                      <span className="text-[10px] text-cyan-400">
                        ⚡ Latency: {act.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{act.reason}</p>
                </div>

                {act.status === "EXECUTED" && (
                  <button
                    onClick={() => handleRollback(act.id)}
                    className="flex items-center gap-1.5 rounded-md border border-amber-600/60 bg-amber-950/40 px-3 py-1.5 font-bold text-amber-200 hover:bg-amber-900/60 hover:text-white shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Rollback Action
                  </button>
                )}
                {act.status === "REVERTED" && (
                  <span className="text-slate-500 text-[11px] italic shrink-0">
                    Reverted at {new Date(act.revertedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyst Continuous Feedback & AI Copilot Split Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Analyst Feedback Loop */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 font-mono">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Analyst Feedback Loop (Self-Tuning AI)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Confirming true or false positives dynamically fine-tunes future detection weights and updates suppression factors.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleFeedback("TRUE_POSITIVE")}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-950/50 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-900/60"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Confirm True Positive (+0.05 eta)
            </button>
            <button
              onClick={() => handleFeedback("FALSE_POSITIVE")}
              className="flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-950/50 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-900/60"
            >
              <RotateCcw className="h-4 w-4 text-amber-400" /> Mark False Positive (-15% Suppression)
            </button>
          </div>
        </div>

        {/* Right: SOC AI Copilot Assistant */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col space-y-3 font-mono">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-cyan-400" />
              SOC AI Investigation Assistant
            </h3>
            <span className="text-[10px] text-slate-400">Gemini 2.5 Flash / Expert SOC</span>
          </div>

          {/* Quick Query Chips */}
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {[
              "Explain root cause & attack sequence",
              "What are the verified IOCs?",
              "Recommend containment playbook",
            ].map((q) => (
              <button
                key={q}
                onClick={() => askCopilot(q)}
                className="rounded bg-slate-800/80 px-2 py-1 text-cyan-300 hover:bg-cyan-950 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-1 no-scrollbar text-xs">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-2.5 ${
                  m.role === "assistant"
                    ? "bg-slate-950 border border-slate-800 text-slate-200"
                    : "bg-cyan-950/60 border border-cyan-800 text-cyan-100 self-end"
                }`}
              >
                <div className="text-[10px] text-slate-500 font-bold">
                  {m.role === "assistant" ? "AegisSOC Copilot" : "Analyst"}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{m.text}</div>
              </div>
            ))}
            {isAsking && (
              <div className="text-cyan-400 text-xs animate-pulse">
                Analyzing forensic telemetry...
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <input
              type="text"
              placeholder="Ask Copilot about IOCs, lateral movement, or containment..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askCopilot()}
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none placeholder-slate-500"
            />
            <button
              onClick={() => askCopilot()}
              disabled={isAsking || !inputQuery.trim()}
              className="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
