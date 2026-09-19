"use client";

import { useState } from "react";
import { ACTIVE_SOAR_PLAYBOOKS, SOARPlaybook } from "@/lib/cyber/playbooks";
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  Lock,
  Radio,
  Terminal,
  Clock,
  ArrowRight,
  Filter,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<SOARPlaybook[]>(ACTIVE_SOAR_PLAYBOOKS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<{ id: string; logs: string[] } | null>(null);

  const toggleAutonomous = (id: string) => {
    setPlaybooks((prev) =>
      prev.map((pb) =>
        pb.id === id ? { ...pb, autonomousEnabled: !pb.autonomousEnabled } : pb
      )
    );
  };

  const simulateDryRun = (pb: SOARPlaybook) => {
    setTestingId(pb.id);
    setTestOutput({
      id: pb.id,
      logs: [
        `[SIMULATOR] Initiating Dry-Run for: "${pb.name}"`,
        `[TRIGGER] Evaluating criteria: Severity in [${pb.severityTrigger.join(", ")}] | MITRE: [${pb.mitreTriggers.join(", ")}]`,
        `[STEP 1] Executing: ${pb.actions[0]?.actionType} -> ${pb.actions[0]?.targetDescription} (0ms latency)`,
        `[STEP 2] Executing: ${pb.actions[1]?.actionType} -> ${pb.actions[1]?.targetDescription} (25ms latency)`,
        `[SUCCESS] All ${pb.actions.length} mitigation actions verified. Immutable audit hash generated: SHA256(0x9a8f...)`,
      ],
    });
    setTimeout(() => {
      setTestingId(null);
    }, 1200);
  };

  const categories = ["ALL", "RANSOMWARE", "LATERAL_MOVEMENT", "CREDENTIALS", "EXFILTRATION", "CLOUD_SECURITY"];

  const filtered = selectedCategory === "ALL"
    ? playbooks
    : playbooks.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Zap className="h-6 w-6 text-cyan-400" />
              SOAR Automation Playbooks
            </h1>
            <span className="rounded-full bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
              5 Active Protocols
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Pre-orchestrated, policy-governed containment pipelines executed autonomously upon anomaly confirmation.
          </p>
        </div>

        {/* Global stats */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-right">
            <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Latency</span>
            <span className="text-lg font-bold text-cyan-400">105 ms</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-right">
            <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Mitigation Rate</span>
            <span className="text-lg font-bold text-emerald-400">100.0%</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-slate-500 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              selectedCategory === cat
                ? "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Playbook List */}
      <div className="grid gap-5">
        {filtered.map((pb) => (
          <div
            key={pb.id}
            className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 backdrop-blur-sm transition hover:border-slate-700/90"
          >
            {/* Playbook Title Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between border-b border-slate-800/70 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-cyan-400 border border-slate-700">
                    {pb.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-100">{pb.name}</h2>
                  <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                    {pb.category}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{pb.description}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => simulateDryRun(pb)}
                  disabled={testingId === pb.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-900/50"
                >
                  {testingId === pb.id ? (
                    <span className="animate-spin">⚙</span>
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Dry-Run Test
                </button>

                <button
                  onClick={() => toggleAutonomous(pb.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    pb.autonomousEnabled
                      ? "bg-emerald-950/80 border border-emerald-700 text-emerald-400"
                      : "bg-slate-800 border border-slate-700 text-slate-400"
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {pb.autonomousEnabled ? "Autonomous: ON" : "Approval Required"}
                </button>
              </div>
            </div>

            {/* Triggers & Stats */}
            <div className="mt-4 grid gap-3 md:grid-cols-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-500 block">Severity Trigger:</span>
                <span className="font-semibold text-rose-400">
                  {pb.severityTrigger.join(" / ")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">MITRE ATT&CK Triggers:</span>
                <span className="font-mono text-cyan-400">
                  {pb.mitreTriggers.join(", ")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Execution Metrics:</span>
                <span className="text-slate-300">
                  {pb.executionCount} runs • {pb.successRate}% success • Last: {pb.lastTriggered}
                </span>
              </div>
            </div>

            {/* Step-by-Step Action Chain */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Automated Execution Pipeline ({pb.actions.length} Steps)
              </span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {pb.actions.map((act) => (
                  <div
                    key={act.step}
                    className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                          Step {act.step}
                        </span>
                        <span className="text-[10px] text-slate-500">+{act.delayMs}ms</span>
                      </div>
                      <span className="mt-2 block font-mono text-xs font-bold text-amber-400">
                        {act.actionType}
                      </span>
                      <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                        {act.targetDescription}
                      </p>
                    </div>
                    {act.isCritical && (
                      <span className="mt-2 inline-block rounded bg-rose-950/80 border border-rose-800/60 px-1.5 py-0.5 text-[9px] font-semibold text-rose-400">
                        Critical Boundary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dry Run Output Panel */}
            {testOutput && testOutput.id === pb.id && (
              <div className="mt-4 rounded-xl border border-cyan-800/80 bg-slate-950 p-4 font-mono text-xs text-cyan-300">
                <div className="flex items-center gap-2 border-b border-cyan-900/60 pb-2 mb-2 font-bold">
                  <Terminal className="h-4 w-4" />
                  Live Dry-Run Telemetry Trace
                </div>
                <div className="space-y-1">
                  {testOutput.logs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
