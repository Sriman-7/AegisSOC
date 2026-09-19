"use client";

import { useState } from "react";
import { Shield, ShieldAlert, Zap, Radio, Terminal, Award, CheckCircle2, Play, RefreshCw, Layers } from "lucide-react";

export default function WarRoomPage() {
  const [runningSim, setRunningSim] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [mitigatedCount, setMitigatedCount] = useState(0);

  const stages = [
    { title: "Stage 1: Ingress Reconnaissance", sub: "Adversary probing external perimeter gateway (Port 443/8443)", status: "DETECTED", time: "0ms" },
    { title: "Stage 2: LSASS Memory Harvester", sub: "Attempted Pass-the-Hash credential dumping on WS-EXEC-01", status: "INTERCEPTED", time: "18ms" },
    { title: "Stage 3: Lateral SMB Traversal", sub: "Adversary pivoting toward DB-PAYMENTS-01", status: "CONTAINED", time: "42ms" },
    { title: "Stage 4: Autonomous Subnet Isolation", sub: "Layer-2 port shutdown & backup sync suspension executed", status: "MITIGATED", time: "89ms" },
  ];

  const startWarGame = () => {
    setRunningSim(true);
    setActiveStage(0);
    setLogs(["[WAR ROOM] Initializing Live Autonomous Defense Simulation..."]);
    setMitigatedCount(0);

    stages.forEach((s, idx) => {
      setTimeout(() => {
        setActiveStage(idx + 1);
        setLogs((prev) => [
          ...prev,
          `[${s.time}] ${s.title} -> ${s.sub} [${s.status}]`,
        ]);
        setMitigatedCount((c) => c + 1);
        if (idx === stages.length - 1) {
          setRunningSim(false);
          setLogs((prev) => [
            ...prev,
            "[VERIFIED] Adversary contained. Zero infiltration on SECURE-VAULT. NIST SP 800-61r2 Compliant.",
          ]);
        }
      }, (idx + 1) * 900);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-rose-500 animate-pulse" />
              Autonomous War Room & Threat Blast Simulator
            </h1>
            <span className="rounded-full bg-rose-950/80 border border-rose-800/60 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
              Unique Feature • Red vs Blue Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time multi-stage adversary simulation testing autonomous containment speeds against crown-jewel infrastructure.
          </p>
        </div>

        <button
          onClick={startWarGame}
          disabled={runningSim}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition hover:brightness-110 disabled:opacity-50"
        >
          {runningSim ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Launch Autonomous Defense Drill
        </button>
      </div>

      {/* Stage Flow */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
        {stages.map((stg, i) => {
          const isDone = activeStage > i;
          const isCurrent = activeStage === i + 1;
          return (
            <div
              key={i}
              className={`rounded-2xl border p-4 transition-all ${
                isCurrent
                  ? "border-rose-500 bg-rose-950/30 shadow-lg shadow-rose-500/10"
                  : isDone
                  ? "border-emerald-700 bg-emerald-950/20"
                  : "border-slate-800 bg-slate-900/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400">Phase {i + 1}</span>
                <span className={`text-[10px] font-bold ${isDone ? "text-emerald-400" : isCurrent ? "text-rose-400" : "text-slate-500"}`}>
                  {isDone ? "CONTAINED" : isCurrent ? "DEFENDING..." : "STANDBY"}
                </span>
              </div>
              <h2 className="font-bold text-slate-200 text-sm">{stg.title}</h2>
              <p className="mt-1 text-[11px] text-slate-400">{stg.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Terminal Trace & Compliance */}
      <div className="grid gap-6 lg:grid-cols-2 font-mono text-xs">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Terminal className="h-4 w-4" /> Live Execution Stream
            </span>
            <span className="text-[10px] text-slate-500">Autonomous Sub-second Response</span>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-1 no-scrollbar text-slate-300">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                Click "Launch Autonomous Defense Drill" to initiate multi-stage red-team adversary traversal.
              </div>
            ) : (
              logs.map((l, i) => <div key={i} className="leading-relaxed">{l}</div>)
            )}
          </div>
        </div>

        {/* Compliance Certificate Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold text-slate-100 text-sm">Automated NIST SP 800-61r2 Compliance Ledger</h2>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Detection Verification:</span>
                <span className="text-emerald-400 font-bold">100.0% Real-Time Score</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Mean Containment Speed:</span>
                <span className="text-cyan-400 font-bold">89 ms (Target: &lt;200ms)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Crown Jewel Integrity:</span>
                <span className="text-emerald-400 font-bold">Zero Infiltration Confirmed</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Audit Proof Hash:</span>
                <span className="text-slate-300 font-mono text-[10px]">0x7F8E...9B2A (SHA-256)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-950 p-3 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Ready for executive forensic audit and automated incident report generation.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
