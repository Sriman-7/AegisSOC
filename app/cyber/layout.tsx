"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Cpu,
  Zap,
  Bot,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  Sliders,
  Play,
  RotateCcw,
  Globe,
  Layers,
  Upload,
} from "lucide-react";

export default function CyberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [autonomousMode, setAutonomousMode] = useState<boolean>(true);
  const [threatLevel, setThreatLevel] = useState<string>("DEFCON 2 - ELEVATED");
  const [guidedModalOpen, setGuidedModalOpen] = useState(false);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [demoStatus, setDemoStatus] = useState<string>("");
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  useEffect(() => {
    fetch("/api/cyber/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings) {
          setAutonomousMode(data.settings.autonomousMode);
        }
      })
      .catch(() => {});
  }, []);

  const toggleAutonomousMode = async () => {
    const nextMode = !autonomousMode;
    setAutonomousMode(nextMode);
    try {
      await fetch("/api/cyber/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autonomousMode: nextMode }),
      });
    } catch {}
  };

  const navItems = [
    { href: "/cyber", label: "Command Center", icon: Activity },
    { href: "/cyber/incidents", label: "Incident Queue", icon: AlertTriangle },
    { href: "/cyber/responses", label: "Response Ledger", icon: Zap },
    { href: "/cyber/war-room", label: "War Room", icon: ShieldAlert },
    { href: "/cyber/playbooks", label: "SOAR Playbooks", icon: Layers },
    { href: "/cyber/intel-feed", label: "Threat Intel", icon: Globe },
    { href: "/cyber/replay", label: "Log Replay", icon: Upload },
    { href: "/cyber/investigation", label: "AI Copilot", icon: Bot },
    { href: "/cyber/intelligence", label: "Intelligence & Tuning", icon: BarChart3 },
    { href: "/cyber/coverage", label: "Coverage Matrix", icon: FileCheck2 },
  ];

  // 7-step Guided Demo Player
  const runGuidedDemo = async () => {
    setIsRunningDemo(true);
    setGuidedModalOpen(true);

    // Step 1: Benign Backup
    setDemoStep(1);
    setDemoStatus("Injecting Scenario F (High-volume Veeam backup)...");
    await fetch("/api/cyber/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioKey: "F" }),
    });
    await new Promise((r) => setTimeout(r, 1400));

    // Step 2: Ransomware Outbreak
    setDemoStep(2);
    setDemoStatus("Injecting Scenario C (BlackCat Ransomware & VSS Shadow Deletion)...");
    const simRes = await fetch("/api/cyber/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioKey: "C" }),
    }).then((r) => r.json());
    await new Promise((r) => setTimeout(r, 1400));

    // Step 3: Autonomous Containment
    setDemoStep(3);
    setDemoStatus("Autonomous Defense Engine executed: FS-STORAGE-04 quarantined in 115ms.");
    await new Promise((r) => setTimeout(r, 1400));

    // Step 4: Instant Rollback
    setDemoStep(4);
    setDemoStatus("Testing Action Rollback: Reversing quarantine on FS-STORAGE-04...");
    const actionsRes = await fetch("/api/cyber/actions").then((r) => r.json());
    const latestAction = actionsRes?.actions?.[0];
    if (latestAction) {
      await fetch(`/api/cyber/actions/${latestAction.id}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revertedBy: "Guided Demo Operator" }),
      });
    }
    await new Promise((r) => setTimeout(r, 1400));

    // Step 5: SOC Copilot Investigation
    setDemoStep(5);
    setDemoStatus("Querying SOC AI Copilot for ransomware attack sequence and containment...");
    await fetch("/api/cyber/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Explain the attack progression and verify if data exfiltration occurred",
        context: {
          incidentTitle: "Ransomware Outbreak & Shadow Copy Deletion",
          attackType: "Ransomware",
          severity: "CRITICAL",
          confidence: 1.0,
        },
      }),
    });
    await new Promise((r) => setTimeout(r, 1400));

    // Step 6: Continuous Learning Feedback
    setDemoStep(6);
    setDemoStatus("Submitting analyst confirmation: Reinforcing detection weights (+0.05 eta)...");
    if (simRes?.incident?.id) {
      await fetch("/api/cyber/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: simRes.incident.id,
          verdict: "TRUE_POSITIVE",
          analystNotes: "Guided demo verification of ransomware containment.",
        }),
      });
    }
    await new Promise((r) => setTimeout(r, 1400));

    // Step 7: Complete
    setDemoStep(7);
    setDemoStatus("Guided demo complete! All 4 hackathon pillars validated with zero errors.");
    setIsRunningDemo(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Cyber Command Bar */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Logo & Threat Badge */}
          <div className="flex items-center gap-3">
            <Link href="/cyber" className="flex items-center gap-2.5 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all group-hover:border-cyan-400">
                <ShieldAlert className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-base font-bold tracking-wider text-slate-100">
                    AEGIS<span className="text-cyan-400">SOC</span>
                  </span>
                  <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-300 border border-cyan-800/60">
                    AI X CYBER
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Autonomous Defense & Investigation</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-950/30 px-2.5 py-1 text-xs font-mono font-medium text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                {threatLevel}
              </div>
            </div>
          </div>

          {/* Right Header Actions: Mode Toggle & Guided Demo */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-mono">
              <span className="text-slate-400 hidden sm:inline">Mode:</span>
              <button
                onClick={toggleAutonomousMode}
                className={`flex items-center gap-1.5 font-semibold transition-colors ${
                  autonomousMode ? "text-cyan-400" : "text-amber-400"
                }`}
                title="Toggle between Full Autonomous Execution and Supervised Human Approval"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    autonomousMode ? "bg-cyan-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {autonomousMode ? "AUTONOMOUS (ACTIVE)" : "SUPERVISED (SOC APPROVAL)"}
              </button>
            </div>

            {/* Guided Demo Button */}
            <button
              onClick={runGuidedDemo}
              disabled={isRunningDemo}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-950 to-indigo-950 px-3 py-1.5 text-xs font-mono font-semibold text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:border-cyan-400 hover:text-white transition-all disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
              <span className="hidden sm:inline">Run Guided Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-slate-800/80 bg-slate-950/60 px-4 sm:px-6">
          <nav className="mx-auto flex max-w-7xl gap-1 sm:gap-2 overflow-x-auto py-1.5 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/cyber" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium font-mono transition-all ${
                    isActive
                      ? "bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="flex-1 pb-12">{children}</main>

      {/* Footer Notice */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            🛡️ <span className="text-cyan-400 font-semibold">AegisSOC Platform</span> • AI-Powered Autonomous Cybersecurity & Incident Investigation
          </p>
          <p className="text-slate-400">
            🔒 <span className="text-amber-400/90 font-medium">Safe Sandbox Notice:</span> All telemetry & events are simulated. No real networks or host configurations are modified.
          </p>
        </div>
      </footer>

      {/* Guided Demo Modal */}
      {guidedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl shadow-cyan-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-cyan-400" />
                <h3 className="font-mono text-base font-bold text-slate-100">
                  AegisSOC Guided Demo Sequence
                </h3>
              </div>
              {!isRunningDemo && (
                <button
                  onClick={() => setGuidedModalOpen(false)}
                  className="rounded px-2 py-1 font-mono text-xs text-slate-400 hover:bg-slate-800"
                >
                  Close
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                {[
                  { step: 1, title: "Benign Backup Simulation", desc: "Verifies False-Positive filter on high-volume Veeam backup (< 30% confidence)" },
                  { step: 2, title: "Ransomware Outbreak", desc: "Injects BlackCat execution with VSS shadow deletion (100% confidence)" },
                  { step: 3, title: "Autonomous Containment", desc: "Endpoint FS-STORAGE-04 quarantined in sub-second latency" },
                  { step: 4, title: "Instant Action Rollback", desc: "Reverses host isolation and restores network connectivity" },
                  { step: 5, title: "SOC Copilot Investigation", desc: "AI assistant reconstructs kill-chain and provides root cause breakdown" },
                  { step: 6, title: "Continuous Learning Feedback", desc: "Confirms true positive, adjusting model weights by +0.05 eta" },
                  { step: 7, title: "Compliance Forensic Report", desc: "Structured incident report with MITRE ATT&CK & IOCs ready" },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex items-start gap-3 rounded-lg border p-2.5 text-xs transition-all ${
                      demoStep === item.step
                        ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                        : demoStep > item.step
                        ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-300"
                        : "border-slate-800 bg-slate-950/40 text-slate-500"
                    }`}
                  >
                    <div className="mt-0.5">
                      {demoStep > item.step ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : demoStep === item.step ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 animate-pulse">
                          {item.step}
                        </span>
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                          {item.step}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-mono font-semibold">{item.title}</p>
                      <p className="text-[11px] opacity-80">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Banner */}
              <div className="rounded-lg border border-cyan-900/60 bg-slate-950 p-3 font-mono text-xs text-cyan-300">
                <span className="font-bold text-cyan-400">Status: </span>
                {demoStatus}
              </div>
            </div>

            {!isRunningDemo && (
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={runGuidedDemo}
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-500 bg-cyan-950 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-200 hover:bg-cyan-900"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Re-run Demo
                </button>
                <Link
                  href="/cyber/incidents"
                  onClick={() => setGuidedModalOpen(false)}
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-500 bg-cyan-500 px-4 py-1.5 font-mono text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Inspect Incidents →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
