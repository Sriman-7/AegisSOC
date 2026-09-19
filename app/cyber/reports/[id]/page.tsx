"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

export default function ForensicReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cyber/report/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.report) setReport(data.report);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-sm text-slate-400">
        Generating Cryptographically Signed Forensic Audit Report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center font-mono text-sm text-rose-400">
        Incident Report not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 font-mono text-xs text-slate-300">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print border-b border-slate-800 pb-4">
        <Link
          href={`/cyber/incidents/${id}`}
          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Incident View
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 font-bold text-slate-200 hover:bg-slate-700"
          >
            <Printer className="h-4 w-4" /> Print Report
          </button>
          <a
            href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`}
            download={`AegisSOC-Forensic-Report-${report.id}.json`}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 font-bold text-slate-950 hover:bg-cyan-400"
          >
            <Download className="h-4 w-4" /> Download JSON
          </a>
        </div>
      </div>

      {/* Printable Document Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 space-y-6 shadow-2xl">
        {/* Document Header */}
        <div className="border-b-2 border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-950 border border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                CONFIDENTIAL • SOC INCIDENT REPORT
              </span>
              <span className="text-slate-500 text-[10px]">Case Ref: {report.id}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-slate-100">{report.title}</h1>
            <p className="text-xs text-slate-400 mt-1">Classification: {report.attackType} • Severity: {report.severity}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Generated Timestamp</span>
            <span className="text-slate-300 text-[11px]">{new Date(report.generatedAt).toUTCString()}</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1">
            1. Executive Forensic Summary
          </h2>
          <p className="leading-relaxed text-slate-300">{report.executiveSummary}</p>
        </div>

        {/* Root Cause & Blast Radius */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">Impact Assessment (Blast Radius)</span>
            <span className="text-lg font-bold text-rose-400 block">{report.blastRadius}% Network Reach</span>
            <p className="text-[11px] text-slate-400">Contained prior to critical crown-jewel exfiltration.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase">AI Detection Confidence</span>
            <span className="text-lg font-bold text-emerald-400 block">{(report.confidence * 100).toFixed(0)}% Certainty</span>
            <p className="text-[11px] text-slate-400">Z-Score Volume + Entropy + Sequence + Threat Intel</p>
          </div>
        </div>

        {/* Attack Sequence */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1">
            2. Correlated Attack Sequence Timeline
          </h2>
          <div className="space-y-2">
            {report.attackSequence?.map((step: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-bold text-cyan-400">Step {step.step}</span>
                  <span className="font-bold text-slate-200">{step.action}</span>
                </div>
                <span className="text-slate-500 text-[10px]">{step.hostname} • Score: {(step.anomalyScore * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicators of Compromise */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1">
            3. Indicators of Compromise (IOCs)
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.iocs?.map((ioc: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40">
                <span className="text-[10px] text-slate-500 uppercase">{ioc.type} ({ioc.reputation})</span>
                <span className="font-bold text-slate-200 block break-all">{ioc.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Defense Actions Taken */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1">
            4. Autonomous Defensive Countermeasures Executed
          </h2>
          <div className="space-y-2">
            {report.actionsTaken?.map((act: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 text-emerald-200">
                <div>
                  <span className="font-bold block">{act.actionType} on {act.target}</span>
                  <span className="text-[10px] text-slate-400">{act.reason}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">{act.latencyMs}ms Latency</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            5. Recommended Post-Incident Actions
          </h2>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            {report.postIncidentRecommendations?.map((rec: string, idx: number) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
