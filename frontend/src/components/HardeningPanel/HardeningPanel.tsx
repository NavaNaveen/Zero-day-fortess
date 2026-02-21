"use client";

import { useState } from "react";
import type { HardeningAction } from "@/types/battle";
import { Shield, ChevronDown, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  actions: HardeningAction[];
  scoreImprovement: number;
}

const PRIORITY_STYLE: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-green-400 bg-green-500/10 border-green-500/30",
};

const CATEGORY_ICON: Record<string, string> = {
  rate_limiting: "⏱",
  headers: "📋",
  cors: "🌐",
  auth: "🔑",
  logging: "📝",
  deps: "📦",
  db: "🗄",
  secrets: "🔒",
  errors: "⚠",
  input_validation: "✅",
  encryption: "🔐",
};

export function HardeningPanel({ actions, scoreImprovement }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (actions.length === 0) return null;

  const toggleExpand = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const totalActions = actions.length;
  const criticalCount = actions.filter((a) => a.priority === "critical").length;
  const shieldPct = Math.min(100, Math.round((totalActions / Math.max(totalActions, 8)) * 100));

  return (
    <div className="border border-blue-500/20 bg-blue-500/5 rounded p-3 animate-phaseIn">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Hardening Command Center</span>
      </div>

      {/* Shield Fill Meter */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg viewBox="0 0 40 40" className="w-full h-full">
            {/* Shield outline */}
            <path
              d="M20 3 L35 10 L35 22 Q35 34 20 38 Q5 34 5 22 L5 10 Z"
              fill="none"
              stroke="#3b82f640"
              strokeWidth="1.5"
            />
            {/* Shield fill */}
            <clipPath id="shield-clip">
              <rect x="0" y={40 - (40 * shieldPct) / 100} width="40" height={(40 * shieldPct) / 100} />
            </clipPath>
            <path
              d="M20 3 L35 10 L35 22 Q35 34 20 38 Q5 34 5 22 L5 10 Z"
              fill="#3b82f630"
              clipPath="url(#shield-clip)"
              className="transition-all duration-1000"
            />
            {/* Percentage text */}
            <text x="20" y="22" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold" fontFamily="monospace">
              {shieldPct}%
            </text>
          </svg>
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">{totalActions} defenses deployed</span>
            {scoreImprovement > 0 && (
              <span className="text-green-400 font-bold">+{scoreImprovement} score</span>
            )}
          </div>
          <div className="w-full h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 rounded-full"
              style={{ width: `${shieldPct}%` }}
            />
          </div>
          {criticalCount > 0 && (
            <div className="text-[9px] text-red-400">{criticalCount} critical fixes applied</div>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {actions.map((action, idx) => {
          const isOpen = expanded.has(idx);
          const icon = CATEGORY_ICON[action.category] || "🛡";
          return (
            <div key={idx} className="border border-[#1e1e2e] rounded">
              <button
                onClick={() => toggleExpand(idx)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-[#12121f] transition-colors"
              >
                <span className="text-xs">{icon}</span>
                <span className="text-[10px] text-slate-300 flex-1 truncate">{action.title}</span>
                <span className={clsx(
                  "text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase",
                  PRIORITY_STYLE[action.priority] || "text-slate-400",
                )}>
                  {action.priority}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-3 h-3 text-slate-600" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                )}
              </button>

              {isOpen && (
                <div className="px-2 pb-2 space-y-1.5 animate-phaseIn">
                  <div className="text-[9px] text-slate-400">{action.description}</div>
                  {action.file_to_modify && (
                    <div className="text-[9px] text-slate-600">
                      File: <span className="text-cyan-400 font-mono">{action.file_to_modify}</span>
                    </div>
                  )}
                  {action.code_snippet && (
                    <pre className="bg-[#0a0a0f] border border-[#1e1e2e] rounded p-2 text-[9px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                      {action.code_snippet}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
