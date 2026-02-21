"use client";

import type { SessionSummary } from "@/types/battle";
import { X, Trash2, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  sessions: SessionSummary[];
  currentId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const stateColor: Record<string, string> = {
  idle: "text-slate-400",
  recon: "text-yellow-400",
  assault: "text-red-400",
  chaining: "text-purple-400",
  patching: "text-amber-400",
  hardening: "text-blue-400",
  reporting: "text-cyan-400",
  complete: "text-green-400",
  error: "text-red-500",
};

const stateDot: Record<string, string> = {
  idle: "bg-slate-400",
  recon: "bg-yellow-400 animate-pulse",
  assault: "bg-red-400 animate-pulse",
  chaining: "bg-purple-400 animate-pulse",
  patching: "bg-amber-400 animate-pulse",
  hardening: "bg-blue-400 animate-pulse",
  reporting: "bg-cyan-400 animate-pulse",
  complete: "bg-green-400",
  error: "bg-red-600",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(start: string, end: string | null) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function SessionHistory({ sessions, currentId, onSelect, onDelete, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-white">Session History</span>
            <span className="text-[10px] text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
              {sessions.length} battles
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {sessions.length === 0 && (
            <div className="text-slate-500 text-xs text-center py-12">
              No battle sessions yet. Start your first battle!
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 border-b border-[#1a1a2a] hover:bg-[#1a1a2e] cursor-pointer transition-colors",
                currentId === s.id && "bg-blue-500/10 border-l-2 border-l-blue-400"
              )}
              onClick={() => { onSelect(s.id); onClose(); }}
            >
              {/* Status dot */}
              <div className={clsx("w-2 h-2 rounded-full flex-shrink-0", stateDot[s.state] ?? "bg-slate-400")} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{formatDate(s.started_at)}</span>
                  <span className={clsx("text-[10px] font-bold uppercase", stateColor[s.state] ?? "text-slate-400")}>
                    {s.state}
                  </span>
                  {s.state === "error" && (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-[10px] text-slate-600">({duration(s.started_at, s.completed_at)})</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-red-400">{s.vulnerability_count} vulns</span>
                  <span className="text-[10px] text-purple-400">{s.chain_count} chains</span>
                  <span className="text-[10px] text-green-400">{s.verified_count} verified</span>
                  {s.compliance_score > 0 && (
                    <span className="text-[10px] text-cyan-400">Score: {s.compliance_score}/100</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1"
                  title="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
