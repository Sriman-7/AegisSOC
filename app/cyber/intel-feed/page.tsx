"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Search,
  Shield,
  ShieldAlert,
  Terminal,
  ExternalLink,
  RefreshCw,
  Layers,
  Database,
  Tag,
  CheckCircle2,
} from "lucide-react";

export default function ThreatIntelFeedPage() {
  const [iocs, setIocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [syncing, setSyncing] = useState(false);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cyber/intel-feed?query=${encodeURIComponent(search)}&type=${filterType}`);
      const data = await res.json();
      if (data.iocs) setIocs(data.iocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [search, filterType]);

  const triggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      fetchFeed();
      setSyncing(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Globe className="h-6 w-6 text-indigo-400" />
              Global Threat Intelligence Feed
            </h1>
            <span className="rounded-full bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
              STIX / TAXII v2.1 Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time synchronized Indicators of Compromise (IOCs), adversary infrastructure, and threat actor profiling.
          </p>
        </div>

        <button
          onClick={triggerSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-cyan-400" : ""}`} />
          {syncing ? "Syncing Feeds..." : "Sync Threat Feeds"}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search IP, domain, file hash, or threat actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "IPV4", "DOMAIN", "FILE_HASH_SHA256"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filterType === t
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Cards */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-cyan-400" />
          Loading threat intelligence corpus...
        </div>
      ) : iocs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
          No matching threat indicators found in current corpus.
        </div>
      ) : (
        <div className="grid gap-4">
          {iocs.map((ioc) => (
            <div
              key={ioc.id}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 backdrop-blur-sm transition hover:border-slate-700"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                      {ioc.reputation}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-indigo-400">
                      {ioc.type}
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-100 break-all">
                      {ioc.indicator}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      <strong className="text-slate-300">Attribution:</strong> {ioc.threatActor}
                    </span>
                    <span>
                      <strong className="text-slate-300">Malware:</strong> {ioc.malwareFamily}
                    </span>
                    <span>
                      <strong className="text-slate-300">Feed:</strong> {ioc.sourceFeed}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Confidence</span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      {ioc.confidenceScore}%
                    </span>
                  </div>
                  <div className="text-right border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-slate-500 uppercase block">Last Seen</span>
                    <span className="text-xs text-slate-300">{ioc.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* MITRE Mapping & Actions */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-500">MITRE Tactics:</span>
                  {ioc.mitreTechniques.map((code: string) => (
                    <span
                      key={code}
                      className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-cyan-400 border border-slate-800"
                    >
                      {code}
                    </span>
                  ))}
                </div>

                <span className="text-[11px] text-slate-500">
                  First Indexed: {ioc.firstSeen}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
