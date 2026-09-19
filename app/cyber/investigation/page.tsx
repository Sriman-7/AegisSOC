"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Send,
  Terminal,
  ShieldAlert,
  Sparkles,
  Zap,
  Server,
  Layers,
  RotateCw,
} from "lucide-react";

export default function InvestigationCopilotPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "AegisSOC Autonomous AI Investigator ready. I can correlate telemetry across endpoints, analyze root cause kill-chains, extract indicators of compromise, and suggest containment playbooks.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cyber/incidents")
      .then((r) => r.json())
      .then((data) => {
        if (data?.incidents && data.incidents.length > 0) {
          setIncidents(data.incidents);
          setSelectedIncidentId(data.incidents[0].id);
        }
      });
  }, []);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  const sendMessage = async (preset?: string) => {
    const query = preset || input;
    if (!query.trim()) return;

    const userMsg = { role: "user" as const, text: query };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/cyber/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          context: {
            incidentTitle: selectedIncident?.title,
            attackType: selectedIncident?.attackType,
            severity: selectedIncident?.severity,
            confidence: selectedIncident?.confidence,
            affectedAssets: JSON.parse(selectedIncident?.affectedAssets || "[]"),
            iocs: JSON.parse(selectedIncident?.iocs || "[]"),
          },
        }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "assistant", text: data.answer || "No response generated." }]);
    } catch {
      setMessages([...updated, { role: "assistant", text: "Error connecting to AI Copilot engine." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Bot className="h-6 w-6 text-cyan-400" />
            AI Investigation Assistant (SOC Copilot)
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Conversational cybersecurity expert powered by Google Gemini 2.5 Flash & AegisSOC Heuristic Intelligence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Context Selector & Threat Highlights */}
        <div className="space-y-4 font-mono text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-300">
              Active Investigation Target
            </h3>

            <div>
              <label className="text-slate-400 block mb-1">Select Correlated Incident:</label>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-200 outline-none"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    [{inc.severity}] {inc.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedIncident && (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">{selectedIncident.attackType}</span>
                  <span className="rounded bg-rose-950 px-1.5 py-0.5 text-[10px] text-rose-300 font-bold">
                    {selectedIncident.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{selectedIncident.description}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span>AI Confidence: <strong className="text-cyan-300">{(selectedIncident.confidence * 100).toFixed(0)}%</strong></span>
                  <span>Blast Radius: <strong className="text-rose-400">{selectedIncident.blastRadius}%</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Threat Hunting Queries */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
            <h3 className="font-bold uppercase tracking-wider text-slate-300">
              Preset Threat Hunting Queries
            </h3>
            <div className="space-y-1.5">
              {[
                "Reconstruct full attack kill-chain sequence",
                "List all verified network and host IOCs",
                "What is the recommended containment playbook?",
                "Which endpoints are within the blast radius?",
                "Analyze adversary attribution and motivation",
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(query)}
                  className="w-full text-left rounded-md border border-slate-800 bg-slate-950 p-2 text-[11px] text-cyan-300 hover:border-cyan-500 hover:bg-cyan-950/40 transition-colors"
                >
                  ⚡ {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Chat Workspace */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col h-[640px] font-mono">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">Grounded Investigation Session</span>
            </div>
            <button
              onClick={() =>
                setMessages([
                  {
                    role: "assistant",
                    text: "Conversation reset. Select an incident and ask any forensic question.",
                  },
                ])
              }
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCw className="h-3 w-3" /> Clear Chat
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-2 no-scrollbar text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3.5 leading-relaxed ${
                  m.role === "assistant"
                    ? "bg-slate-950 border border-slate-800 text-slate-200"
                    : "bg-cyan-950/60 border border-cyan-800/80 text-cyan-100 ml-8"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1.5">
                  {m.role === "assistant" ? (
                    <>
                      <Bot className="h-3.5 w-3.5 text-cyan-400" />
                      <span>AegisSOC Copilot</span>
                    </>
                  ) : (
                    <span>Security Administrator</span>
                  )}
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse font-mono">
                <Sparkles className="h-4 w-4" />
                Querying multi-source telemetry and MITRE ATT&CK taxonomy...
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-800 pt-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Copilot about IOCs, lateral movement, or containment..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 outline-none placeholder-slate-500 focus:border-cyan-400"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
