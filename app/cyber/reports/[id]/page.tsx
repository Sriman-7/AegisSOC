"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
} from "lucide-react";
import { IncidentReport } from "@/lib/cyber/types";

export default function ForensicReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cyber/report/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.report) setReport(data.report);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !report) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center font-mono text-cyan-400">
        Compiling official forensic incident report...
      </div>
    );
  }

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AegisSOC-Report-${report.incidentId}.json`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6 font-mono text-slate-200">
      {/* Action Bar (hidden on print) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
        <Link
          href={`/cyber/incidents/${id}`}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Incident View
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5 text-cyan-400" /> Print Document
          </button>
          <button
            onClick={downloadJson}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-900"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" /> Download JSON
          </button>
        </div>
      </div>

      {/* Official Forensic Report Document Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-cyan-400" />
              <span className="text-xl font-bold tracking-wider text-slate-100">
                AEGIS<span className="text-cyan-400">SOC</span> FORENSIC INVESTIGATION REPORT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated Incident Containment & Threat Intelligence Audit
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Report ID: <strong className="text-slate-200">{report.incidentId}</strong></p>
            <p>Generated: <strong className="text-slate-200">{new Date(report.generatedAt).toLocaleString()}</strong></p>
            <p>Classification: <strong className="text-rose-400 font-bold">{report.severity} SEVERITY</strong></p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
            1. Executive Forensic Summary
          </h2>
          <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/80 p-4 rounded-lg border border-slate-800">
            {report.executiveSummary}
          </p>
        </div>

        {/* Triage & Impact Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 uppercase text-[10px]">Threat Vector</span>
            <p className="font-bold text-slate-200 mt-1">{report.attackType}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 uppercase text-[10px]">Severity Level</span>
            <p className="font-bold text-rose-400 mt-1">{report.severity}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 uppercase text-[10px]">Incident Risk Score</span>
            <p className="font-bold text-amber-400 mt-1">{report.riskScore} / 100</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 uppercase text-[10px]">Blast Radius</span>
            <p className="font-bold text-cyan-400 mt-1">{report.blastRadiusPercentage}% Network</p>
          </div>
        </div>

        {/* MITRE ATT&CK Matrix */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
            2. MITRE ATT&CK Framework Coverage
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Technique ID</th>
                  <th className="p-2.5">Tactic</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {report.mitreCoverage.map((m) => (
                  <tr key={m.id}>
                    <td className="p-2.5 font-bold text-cyan-400">{m.id}</td>
                    <td className="p-2.5 font-semibold text-indigo-300">{m.tactic}</td>
                    <td className="p-2.5 text-slate-200">{m.name}</td>
                    <td className="p-2.5 text-slate-400 text-[11px]">{m.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reconstructed Attack Sequence */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
            3. Reconstructed Attack Sequence Chronology
          </h2>
          <div className="space-y-2">
            {report.attackSequence.map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 border border-cyan-700 text-[10px] font-bold text-cyan-300">
                  {step.step}
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">
                      [{step.techniqueId}] {step.phase}: {step.description}
                    </span>
                    <span className="text-slate-500">{new Date(step.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Source: <code className="text-cyan-300">{step.source}</code> → Target: <code className="text-amber-300">{step.target}</code>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Evidence: <span className="text-slate-300 font-semibold">{step.evidence}</span> (Anomaly Score: {(step.anomalyScore * 100).toFixed(0)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Assets & Blast Radius */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
            4. Affected Network Infrastructure
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Hostname</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Containment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {report.affectedAssets.map((asset) => (
                  <tr key={asset.hostname}>
                    <td className="p-2.5 font-bold text-slate-200">{asset.hostname}</td>
                    <td className="p-2.5 text-slate-400">{asset.ip}</td>
                    <td className="p-2.5 text-slate-300">{asset.role}</td>
                    <td className="p-2.5">
                      <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* IOCs */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
            5. Forensic Indicators of Compromise (IOCs)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Value</th>
                  <th className="p-2.5">Reputation</th>
                  <th className="p-2.5">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {report.iocs.map((ioc, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-bold text-cyan-400">{ioc.type}</td>
                    <td className="p-2.5 text-slate-200">{ioc.value}</td>
                    <td className="p-2.5 font-bold text-rose-400">{ioc.reputation}</td>
                    <td className="p-2.5 text-slate-400 text-[11px]">{ioc.context}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Autonomous Defenses Triggered */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
            6. Autonomous Defensive Actions Triggered
          </h2>
          <div className="space-y-2">
            {report.autonomousDefensesTriggered.map((act, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
                <div>
                  <span className="font-bold text-cyan-300">{act.action} on {act.target}</span>
                  <p className="text-[11px] text-slate-500">Executed: {new Date(act.executedAt).toLocaleString()}</p>
                </div>
                <span className="rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Post-Incident Recommendations */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
            7. Post-Incident Hardening Recommendations
          </h2>
          <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside bg-slate-950/80 p-4 rounded-lg border border-slate-800">
            {report.postIncidentRecommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
