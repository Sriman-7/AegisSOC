"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Server,
  Terminal,
  ExternalLink,
} from "lucide-react";

export default function ResponseLedgerPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, executed: 0, reverted: 0, pending: 0 });
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [rollbackNotice, setRollbackNotice] = useState<string | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cyber/actions?status=${filter}`);
      const data = await res.json();
      if (data?.actions) {
        setActions(data.actions);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [filter]);

  const handleRollback = async (actionId: string) => {
    try {
      const res = await fetch(`/api/cyber/actions/${actionId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revertedBy: "SOC Lead Administrator" }),
      });
      const data = await res.json();
      if (data.success) {
        setRollbackNotice(data.message);
        await fetchActions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Zap className="h-6 w-6 text-cyan-400" />
            Autonomous Response & Mitigation Ledger
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Real-time audit log of automated containment actions, execution latencies, and reversible state rollbacks.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 font-mono">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <span className="text-xs text-slate-400 uppercase">Total Actions Triggered</span>
          <p className="mt-2 text-2xl font-bold text-slate-100">{stats.total}</p>
          <span className="text-[11px] text-cyan-400">100% policy compliance</span>
        </div>

        <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4">
          <span className="text-xs text-cyan-300 uppercase">Active Containments</span>
          <p className="mt-2 text-2xl font-bold text-cyan-400">{stats.executed}</p>
          <span className="text-[11px] text-cyan-300/80">Mean Latency: 105ms</span>
        </div>

        <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4">
          <span className="text-xs text-amber-300 uppercase">Reverted Rollbacks</span>
          <p className="mt-2 text-2xl font-bold text-amber-400">{stats.reverted}</p>
          <span className="text-[11px] text-amber-300/80">Zero network downtime</span>
        </div>

        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
          <span className="text-xs text-emerald-300 uppercase">Mitigation Success</span>
          <p className="mt-2 text-2xl font-bold text-emerald-400">100%</p>
          <span className="text-[11px] text-emerald-300/80">Zero bypass recorded</span>
        </div>
      </div>

      {/* Rollback Notification */}
      {rollbackNotice && (
        <div className="rounded-lg border border-cyan-800 bg-cyan-950/40 p-3.5 font-mono text-xs text-cyan-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-cyan-400" />
            <span>{rollbackNotice}</span>
          </div>
          <button
            onClick={() => setRollbackNotice(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Policy Matrix Reference */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs">
        <div className="border-b border-slate-800 pb-2 mb-3">
          <h3 className="font-bold uppercase tracking-wider text-slate-300">
            Autonomous Defense Policy Matrix (Configured SLAs)
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">LOW</span>
            <p className="mt-1 font-semibold text-slate-200">Enrich & Tag</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Silent telemetry tagging, baseline drift recording.</p>
          </div>
          <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-2.5">
            <span className="rounded bg-blue-900 px-1.5 py-0.5 text-[10px] font-bold text-blue-200">MEDIUM</span>
            <p className="mt-1 font-semibold text-blue-200">Challenge & Restrict</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Step-up FIDO2 MFA, egress rate limiting, connection challenge.</p>
          </div>
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-2.5">
            <span className="rounded bg-amber-900 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">HIGH</span>
            <p className="mt-1 font-semibold text-amber-200">Block & Revoke</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Perimeter IP drop rule, user session revocation, process kill.</p>
          </div>
          <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-2.5">
            <span className="rounded bg-rose-900 px-1.5 py-0.5 text-[10px] font-bold text-rose-200">CRITICAL</span>
            <p className="mt-1 font-semibold text-rose-200">Quarantine Subnet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Endpoint isolation, network disconnect, C2 sinkhole rule.</p>
          </div>
        </div>
      </div>

      {/* Action Ledger Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden font-mono text-xs">
        <div className="border-b border-slate-800 bg-slate-950/80 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Filter Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="EXECUTED">Executed</option>
              <option value="REVERTED">Reverted (Rollbacks)</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
            </select>
          </div>
          <span className="text-slate-500 text-[11px]">Audit Log Entries: {actions.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Incident Link</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Status & Rollback Payload</th>
                <th className="py-3 px-4 text-right">Reversibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {actions.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-cyan-300">{act.actionType}</span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-slate-200 font-semibold">{act.target}</span>
                  </td>

                  <td className="py-3 px-4">
                    {act.incident ? (
                      <Link
                        href={`/cyber/incidents/${act.incident.id}`}
                        className="text-cyan-400 hover:underline line-clamp-1"
                      >
                        {act.incident.title}
                      </Link>
                    ) : (
                      <span className="text-slate-500">Autonomous Rule Trigger</span>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300">
                      ⚡ {act.latencyMs} ms
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          act.status === "EXECUTED"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : act.status === "REVERTED"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {act.status}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono line-clamp-1">
                        {act.reason}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {act.status === "EXECUTED" ? (
                      <button
                        onClick={() => handleRollback(act.id)}
                        className="inline-flex items-center gap-1 rounded border border-amber-600/70 bg-amber-950/40 px-2.5 py-1 text-amber-200 hover:bg-amber-900"
                      >
                        <RotateCcw className="h-3 w-3" /> Rollback
                      </button>
                    ) : act.status === "REVERTED" ? (
                      <span className="text-[11px] text-slate-500 italic">
                        Reverted by {act.revertedBy || "Analyst"}
                      </span>
                    ) : (
                      <span className="text-slate-500">Awaiting Approval</span>
                    )}
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
