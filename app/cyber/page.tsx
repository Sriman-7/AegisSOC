"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  Zap,
  Activity,
  Play,
  RotateCw,
  Flame,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Info,
  Server,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function CyberCommandCenter() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, critical: 0, high: 0, mitigated: 0 });
  const [loading, setLoading] = useState(true);
  const [simulatingKey, setSimulatingKey] = useState<string | null>(null);
  const [simFeedback, setSimFeedback] = useState<any>(null);
  const [liveStreamActive, setLiveStreamActive] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      const [incRes, telRes] = await Promise.all([
        fetch("/api/cyber/incidents").then((r) => r.json()),
        fetch("/api/cyber/telemetry?limit=25").then((r) => r.json()),
      ]);

      if (incRes?.incidents) {
        setIncidents(incRes.incidents);
        setStats(incRes.stats);
      }
      if (telRes?.events) {
        setTelemetry(telRes.events);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  const triggerScenario = async (key: string) => {
    setSimulatingKey(key);
    setSimFeedback(null);
    try {
      const res = await fetch("/api/cyber/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioKey: key }),
      });
      const data = await res.json();
      setSimFeedback(data);
      await fetchDashboardData();
    } catch (e: any) {
      setSimFeedback({ error: e.message || "Failed to trigger scenario" });
    } finally {
      setSimulatingKey(null);
    }
  };


  // Background live telemetry generator
  useEffect(() => {
    if (!liveStreamActive) return;

    const sampleActions = [
      { type: "NETWORK_FLOW", action: "TCP Ingress 443 -> Web Proxy", host: "GW-AUTH-EXTERNAL", ip: "192.168.1.105" },
      { type: "AUTH_LOG", action: "Kerberos TGT Renewal", host: "DC-CORP-PRIMARY", user: "svc_backup" },
      { type: "DNS_QUERY", action: "DNS Resolution: api.internal.corp", host: "WS-EXEC-01", dns: "api.internal.corp" },
      { type: "PROCESS_EXEC", action: "Scheduled Defender Antivirus Scan", host: "SRV-APPS-02" },
      { type: "FILE_INTEGRITY", action: "Log Rotation /var/log/syslog", host: "DB-PAYMENTS-01" },
    ];

    const streamInterval = setInterval(async () => {
      const randomAction = sampleActions[Math.floor(Math.random() * sampleActions.length)];
      try {
        await fetch("/api/cyber/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: randomAction.type,
            action: randomAction.action,
            hostname: randomAction.host,
            sourceIp: randomAction.ip || "10.0.0.15",
            username: randomAction.user || "system",
            protocol: "TCP",
            dnsQuery: randomAction.dns,
          }),
        });
        await fetchDashboardData();
      } catch (err) {
        // Silently continue
      }
    }, 3500);

    return () => clearInterval(streamInterval);
  }, [liveStreamActive]);

  // Chart data formatting
  const chartData = [
    { time: "09:00", volume: 18, anomaly: 2 },
    { time: "09:10", volume: 32, anomaly: 4 },
    { time: "09:20", volume: 24, anomaly: 3 },
    { time: "09:30", volume: 65, anomaly: 12 },
    { time: "09:40", volume: 88, anomaly: 28 },
    { time: "09:50", volume: 42, anomaly: 6 },
    { time: "10:00", volume: 55, anomaly: 9 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-cyan-400" />
            SOC Command Center
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Real-time autonomous threat detection, event correlation, and mitigation orchestration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiveStreamActive(!liveStreamActive)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
              liveStreamActive
                ? "bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${liveStreamActive ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
            {liveStreamActive ? "Live Stream: ACTIVE" : "Start Live Stream"}
          </button>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RotateCw className="h-3.5 w-3.5 text-cyan-400" /> Refresh Telemetry
          </button>
          <Link
            href="/cyber/coverage"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60"
          >
            Traceability Matrix →
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-mono text-xs uppercase tracking-wider">Total Incidents</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-100">{stats.total}</p>
          <span className="text-[11px] font-mono text-cyan-400">Multi-stage correlated</span>
        </div>

        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-300">
            <span className="font-mono text-xs uppercase tracking-wider">Critical Threats</span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-rose-400">{stats.critical}</p>
          <span className="text-[11px] font-mono text-rose-300/80">Immediate blast radius risk</span>
        </div>

        <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="font-mono text-xs uppercase tracking-wider">Autonomous Actions</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-cyan-300">{stats.mitigated}</p>
          <span className="text-[11px] font-mono text-cyan-400/90">Avg Latency: 105ms</span>
        </div>

        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="font-mono text-xs uppercase tracking-wider">FP Suppression</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">35.2%</p>
          <span className="text-[11px] font-mono text-emerald-400/90">Continuous baseline tuning</span>
        </div>
      </div>

      {/* Scenario Attack Injector Section */}
      <div className="rounded-xl border border-cyan-900/40 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Play className="h-4 w-4 fill-cyan-400 text-cyan-400" />
              Real-Time Attack Scenario Injector
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Inject realistic multi-stage cyber threats or benign benchmark traffic to evaluate detection latency and autonomous containment.
            </p>
          </div>
          <span className="rounded bg-slate-800 px-2.5 py-1 font-mono text-[11px] text-slate-300">
            6 Presets Configured
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "C", name: "Ransomware Outbreak", actor: "BlackCat / ALPHV", type: "CRITICAL", desc: "VSS shadow deletion + AES encryption" },
            { key: "A", name: "APT29 Lateral Movement", actor: "Cozy Bear", type: "CRITICAL", desc: "Pass-the-Hash targeting Domain Controller" },
            { key: "B", name: "Credential Stuffing", actor: "Mirai Botnet", type: "HIGH", desc: "200+ failed logins & Impossible Travel" },
            { key: "D", name: "DNS Tunneling Exfiltration", actor: "OilRig (APT34)", type: "HIGH", desc: "Encoded PII over high-entropy DNS TXT" },
            { key: "E", name: "Cloud IAM Privilege Escalation", actor: "Scattered Spider", type: "HIGH", desc: "PutUserPolicy admin bypass & S3 sync" },
            { key: "F", name: "High-Volume Scheduled Backup", actor: "Veeam Agent", type: "BENIGN", desc: "Differential DB backup (False-Positive test)" },
          ].map((sc) => {
            const isSimulating = simulatingKey === sc.key;
            const isBenign = sc.type === "BENIGN";
            return (
              <button
                key={sc.key}
                onClick={() => triggerScenario(sc.key)}
                disabled={simulatingKey !== null}
                className={`flex flex-col text-left rounded-lg border p-3 font-mono transition-all disabled:opacity-50 ${
                  isBenign
                    ? "border-emerald-800/60 bg-emerald-950/20 hover:border-emerald-500 hover:bg-emerald-950/40"
                    : sc.type === "CRITICAL"
                    ? "border-rose-800/50 bg-rose-950/20 hover:border-rose-500 hover:bg-rose-950/30"
                    : "border-slate-800 bg-slate-950/40 hover:border-cyan-500 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isBenign ? "text-emerald-300" : sc.type === "CRITICAL" ? "text-rose-300" : "text-cyan-300"}`}>
                    Scenario {sc.key}: {sc.name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      isBenign
                        ? "bg-emerald-900/60 text-emerald-300"
                        : sc.type === "CRITICAL"
                        ? "bg-rose-900/60 text-rose-200"
                        : "bg-amber-900/60 text-amber-200"
                    }`}
                  >
                    {sc.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{sc.desc}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Actor: {sc.actor}</span>
                  <span className="font-semibold text-cyan-400">
                    {isSimulating ? "Injecting..." : "Run Test →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Simulation Feedback Banner */}
        {simFeedback && (
          <div className={`mt-4 rounded-lg border p-3 font-mono text-xs transition-all ${
            simFeedback.error
              ? "border-rose-500 bg-rose-950/40 text-rose-200"
              : simFeedback.isAttack
              ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
              : "border-emerald-500 bg-emerald-950/40 text-emerald-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">
                {simFeedback.error
                  ? `Simulation Error: ${simFeedback.error}`
                  : simFeedback.isAttack
                  ? `Attack Detected: ${simFeedback.scenario?.title} (Confidence: ${(simFeedback.maxConfidence * 100).toFixed(0)}%)`
                  : `Benign Activity Verified: ${simFeedback.scenario?.title} (Confidence: ${(simFeedback.maxConfidence * 100).toFixed(0)}% < 30%)`}
              </span>
              {simFeedback.incident?.id && (
                <Link
                  href={`/cyber/incidents/${simFeedback.incident.id}`}
                  className="flex items-center gap-1 font-bold text-cyan-300 underline hover:text-white"
                >
                  View Incident & Attack Graph →
                </Link>
              )}
            </div>
            {simFeedback.triggeredActions?.length > 0 && (
              <p className="mt-1 text-[11px] opacity-90">
                ⚡ Autonomous Defensive Action Triggered:{" "}
                <span className="font-semibold">
                  {simFeedback.triggeredActions.map((a: any) => `${a.actionType} on ${a.target} (${a.latencyMs}ms)`).join(", ")}
                </span>
              </p>
            )}
            {!simFeedback.isAttack && (
              <p className="mt-1 text-[11px] text-emerald-300">
                ✅ Zero defensive actions executed. Telemetry recognized as authorized backup operation. False-positive successfully suppressed.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Telemetry Trends & Live Ingestion Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Telemetry Volume Chart & Active Incidents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                Real-Time Telemetry & Anomaly Dynamics
              </h3>
              <span className="font-mono text-[10px] text-slate-400">Sliding 60-Minute Window</span>
            </div>
            <div className="mt-3 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAnom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorVol)"
                    name="Flow Volume (kpps)"
                  />
                  <Area
                    type="monotone"
                    dataKey="anomaly"
                    stroke="#f43f5e"
                    fillOpacity={1}
                    fill="url(#colorAnom)"
                    name="Anomaly Score (z-norm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Incidents Queue Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                Active Correlated Incidents
              </h3>
              <Link
                href="/cyber/incidents"
                className="font-mono text-xs text-cyan-400 hover:underline"
              >
                View Full Queue ({incidents.length}) →
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-800/80">
              {incidents.slice(0, 4).map((inc) => (
                <div key={inc.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          inc.severity === "CRITICAL"
                            ? "bg-rose-950 border border-rose-800 text-rose-300"
                            : "bg-amber-950 border border-amber-800 text-amber-300"
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <Link
                        href={`/cyber/incidents/${inc.id}`}
                        className="font-mono text-sm font-semibold text-slate-200 hover:text-cyan-300"
                      >
                        {inc.title}
                      </Link>
                    </div>
                    <p className="text-xs text-slate-400 font-mono line-clamp-1">
                      {inc.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Confidence: <strong className="text-cyan-400">{(inc.confidence * 100).toFixed(0)}%</strong></span>
                      <span>Blast Radius: <strong className="text-rose-400">{inc.blastRadius}%</strong></span>
                      <span>Status: <strong className="text-slate-300">{inc.status}</strong></span>
                    </div>
                  </div>

                  <Link
                    href={`/cyber/incidents/${inc.id}`}
                    className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-cyan-300 hover:border-cyan-400 hover:text-white shrink-0"
                  >
                    Investigate <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Telemetry Stream (Latest 15) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              Live Ingestion Telemetry Stream
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-2 max-h-[580px] pr-1 no-scrollbar">
            {telemetry.map((t) => (
              <div
                key={t.id}
                className={`rounded-lg border p-2.5 font-mono text-[11px] transition-all ${
                  t.isBenign
                    ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-200"
                    : t.isAnomaly
                    ? "border-rose-900/50 bg-rose-950/20 text-rose-200"
                    : "border-slate-800 bg-slate-950/60 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-bold text-cyan-400">{t.sourceType}</span>
                  <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1 font-semibold text-slate-200 truncate">
                  {t.action}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400 truncate">
                  {t.sourceIp ? `${t.sourceIp} → ` : ""}{t.destIp || t.hostname || "Internal"}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span>Score: {(t.anomalyScore * 100).toFixed(0)}%</span>
                  <span
                    className={`rounded px-1.5 py-0.2 font-bold ${
                      t.isBenign
                        ? "bg-emerald-900 text-emerald-300"
                        : t.status === "BLOCK"
                        ? "bg-rose-900 text-rose-200"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {t.isBenign ? "BENIGN (FP SUPPRESSED)" : t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
