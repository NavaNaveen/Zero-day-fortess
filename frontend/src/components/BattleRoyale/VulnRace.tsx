"use client";

import type { BattleSession } from "@/types/battle";
import { PROVIDER_COLORS } from "@/components/ProviderSelector/ProviderSelector";
import { Trophy } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  sessions: Record<string, BattleSession>;
  providers: string[];
}

const BAR_BG: Record<string, string> = {
  ollama: "bg-purple-500",
  anthropic: "bg-orange-500",
  openai: "bg-green-500",
  gemini: "bg-blue-500",
};

const BAR_GLOW: Record<string, string> = {
  ollama: "shadow-[0_0_12px_rgba(168,85,247,0.4)]",
  anthropic: "shadow-[0_0_12px_rgba(249,115,22,0.4)]",
  openai: "shadow-[0_0_12px_rgba(34,197,94,0.4)]",
  gemini: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
};

interface ProviderStat {
  provider: string;
  vulnCount: number;
  criticalCount: number;
  phase: string;
  isComplete: boolean;
}

export function VulnRace({ sessions, providers }: Props) {
  // Build sorted stats
  const stats: ProviderStat[] = providers
    .map((p) => {
      const s = sessions[p];
      return {
        provider: p,
        vulnCount: s?.vulnerabilities.length ?? 0,
        criticalCount: s?.vulnerabilities.filter((v) => v.severity === "critical").length ?? 0,
        phase: s?.state ?? "idle",
        isComplete: s?.state === "complete",
      };
    })
    .sort((a, b) => b.vulnCount - a.vulnCount);

  const maxVulns = Math.max(1, ...stats.map((s) => s.vulnCount));
  const allComplete = stats.every((s) => s.isComplete);
  const anyActive = stats.some((s) => !s.isComplete && s.phase !== "idle");

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded p-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">VulnRace — Live Vulnerability Count</span>
        </div>
        {allComplete && (
          <span className="text-[10px] text-green-400 font-bold px-2 py-0.5 border border-green-500/30 rounded bg-green-500/10">
            RACE COMPLETE
          </span>
        )}
        {anyActive && !allComplete && (
          <span className="text-[10px] text-amber-400 animate-pulse font-bold">RACING...</span>
        )}
      </div>

      <div className="space-y-3">
        {stats.map((stat, idx) => {
          const pct = maxVulns > 0 ? (stat.vulnCount / maxVulns) * 100 : 0;
          const isLeader = idx === 0 && stat.vulnCount > 0;

          return (
            <div key={stat.provider} className="flex items-center gap-3">
              {/* Rank */}
              <div className="w-5 text-right text-[10px] font-bold text-slate-600">
                {idx === 0 && stat.vulnCount > 0 ? "🥇" : idx === 1 && stat.vulnCount > 0 ? "🥈" : `#${idx + 1}`}
              </div>

              {/* Provider name */}
              <div className={clsx("w-20 text-[10px] font-bold uppercase truncate", PROVIDER_COLORS[stat.provider] || "text-slate-400")}>
                {stat.provider}
              </div>

              {/* Bar */}
              <div className="flex-1 h-6 bg-[#1e1e2e] rounded-full overflow-hidden relative">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    BAR_BG[stat.provider] || "bg-slate-500",
                    isLeader && (BAR_GLOW[stat.provider] || ""),
                    !stat.isComplete && stat.phase !== "idle" && "animate-pulse",
                  )}
                  style={{ width: `${Math.max(pct, stat.vulnCount > 0 ? 5 : 0)}%` }}
                />
                {stat.vulnCount > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">
                    {stat.vulnCount} vuln{stat.vulnCount !== 1 ? "s" : ""}
                    {stat.criticalCount > 0 && <span className="text-red-300"> ({stat.criticalCount} crit)</span>}
                  </span>
                )}
              </div>

              {/* Phase label */}
              <div className={clsx(
                "w-20 text-[9px] font-bold uppercase text-right",
                stat.isComplete ? "text-green-400" : "text-slate-600",
              )}>
                {stat.phase}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
