"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function IncidentsQueuePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severityFilter !== "ALL") params.append("severity", severityFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/cyber/incidents?${params.toString()}`);
      const data = await res.json();
      if (data?.incidents) {
        setIncidents(data.incidents);
      }
    } catch (e) {
      console.error("Failed to load incidents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            Prioritized Incident Queue
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Correlated multi-source security incidents triaged by threat severity, blast radius, and asset criticality.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-slate-300">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search threat, actor, CVE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchIncidents()}
              className="bg-transparent outline-none text-slate-200 placeholder-slate-500 w-44 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5">
            <span className="text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none"
            >
              <option value="ALL" className="bg-slate-900">All</option>
              <option value="CRITICAL" className="bg-slate-900">Critical</option>
              <option value="HIGH" className="bg-slate-900">High</option>
              <option value="MEDIUM" className="bg-slate-900">Medium</option>
              <option value="LOW" className="bg-slate-900">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none"
            >
              <option value="ALL" className="bg-slate-900">All</option>
              <option value="OPEN" className="bg-slate-900">Open</option>
              <option value="INVESTIGATING" className="bg-slate-900">Investigating</option>
              <option value="MITIGATED" className="bg-slate-900">Mitigated</option>
              <option value="RESOLVED" className="bg-slate-900">Resolved</option>
            </select>
          </div>
        </div>

        <span className="text-slate-400">
          Showing {incidents.length} incidents
        </span>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
              <tr>
                <th className="py-3 px-4">Severity & Triage</th>
                <th className="py-3 px-4">Incident Title & Description</th>
                <th className="py-3 px-4">Attack Phase</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4">Blast Radius</th>
                <th className="py-3 px-4">Status & Mitigation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {incidents.map((inc) => {
                const mitreList = JSON.parse(inc.mitreTechniques || "[]") as string[];
                const assets = JSON.parse(inc.affectedAssets || "[]") as string[];
                return (
                  <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                            inc.severity === "CRITICAL"
                              ? "bg-rose-950 border border-rose-800 text-rose-300"
                              : inc.severity === "HIGH"
                              ? "bg-amber-950 border border-amber-800 text-amber-300"
                              : "bg-blue-950 border border-blue-800 text-blue-300"
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Risk: {inc.riskScore}/100
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/cyber/incidents/${inc.id}`}
                        className="font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                      >
                        {inc.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {inc.description}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mitreList.slice(0, 3).map((code) => (
                          <span
                            key={code}
                            className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] text-cyan-300"
                          >
                            {code}
                          </span>
                        ))}
                        {assets.length > 0 && (
                          <span className="text-[10px] text-slate-500">
                            • Assets: {assets.join(", ")}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="rounded bg-indigo-950/70 border border-indigo-900/60 px-2 py-0.5 text-[10px] text-indigo-300 font-semibold">
                        {inc.attackPhase}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400"
                            style={{ width: `${inc.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-bold text-cyan-400">
                          {(inc.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-rose-400">
                        {inc.blastRadius}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            inc.status === "MITIGATED"
                              ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                              : inc.status === "OPEN"
                              ? "bg-rose-950 border border-rose-800 text-rose-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {inc.status}
                        </span>
                        {inc.isAutonomousMitigated && (
                          <p className="text-[9px] text-cyan-400 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Autonomous Action
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/cyber/incidents/${inc.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-900 hover:text-white"
                      >
                        Deep View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
