"use client";

import { useState } from "react";
import { Upload, Play, Terminal, CheckCircle2, FileText, RefreshCw } from "lucide-react";

export default function LogReplayPage() {
  const [logText, setLogText] = useState("");
  const [loading, setLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<any>(null);

  const loadSample = () => {
    const sample = [
      { sourceType: "SYSTEM", action: "vssadmin.exe delete shadows /all /quiet", hostname: "FS-STORAGE-04", sourceIp: "10.0.1.45" },
      { sourceType: "NETWORK", action: "DNS Query: dGVzdC1leGZpbC5kYXJrb3BzLmlv", hostname: "WS-EXEC-01", dnsQuery: "dGVzdC1leGZpbC5kYXJrb3BzLmlv" },
      { sourceType: "AUTH", action: "Multiple Failed Kerberos Pre-Auth (x45)", hostname: "DC-CORP-PRIMARY", sourceIp: "185.220.101.5", username: "Administrator" },
      { sourceType: "SYSTEM", action: "Normal Defender AV Definition Update", hostname: "SRV-APPS-02", sourceIp: "10.0.1.12" }
    ];
    setLogText(JSON.stringify(sample, null, 2));
  };

  const handleReplay = async () => {
    try {
      setLoading(true);
      const parsed = JSON.parse(logText);
      const res = await fetch("/api/cyber/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      setReplayResult(data);
    } catch (err: any) {
      alert("Invalid JSON: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Upload className="h-6 w-6 text-cyan-400" />
          Real-Format Log Replay Engine
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload or paste JSON logs (Sysmon, Zeek, Auth) to evaluate directly against the AegisSOC multi-factor anomaly engine.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">Raw JSON Telemetry Batch</span>
            <button
              onClick={loadSample}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" /> Load Pre-built Sample
            </button>
          </div>

          <textarea
            rows={14}
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder="Paste JSON array of events here..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          />

          <button
            onClick={handleReplay}
            disabled={loading || !logText.trim()}
            className="w-full rounded-xl bg-cyan-600 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Execute Real-Time Batch Replay
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 font-mono text-xs">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="font-bold text-slate-200">Replay Engine Output</h2>
            <span className="text-[11px] text-slate-400">Real-time evaluation against Z-score, Entropy, and Sequence formulas</span>
          </div>

          {replayResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-slate-500 text-[10px] uppercase block">Total Replayed</span>
                  <span className="text-lg font-bold text-slate-100">{replayResult.replayedCount}</span>
                </div>
                <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-3">
                  <span className="text-rose-400 text-[10px] uppercase block">Anomalies Detected</span>
                  <span className="text-lg font-bold text-rose-400">{replayResult.anomaliesDetected}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                {replayResult.results?.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      r.isAnomaly
                        ? "bg-rose-950/40 border-rose-800/60 text-rose-200"
                        : "bg-slate-950 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div>
                      <span className="font-bold block">{r.action}</span>
                      <span className="text-[10px] text-slate-400">Severity: {r.severity}</span>
                    </div>
                    <span className="font-bold text-cyan-400">{(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Paste or load sample logs on the left and click "Execute Real-Time Batch Replay" to inspect engine scores.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
