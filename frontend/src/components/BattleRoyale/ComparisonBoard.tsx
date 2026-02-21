"use client";

import type { BattleSession } from "@/types/battle";
import { PROVIDER_COLORS } from "@/components/ProviderSelector/ProviderSelector";
import { Trophy, Medal } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  sessions: Record<string, BattleSession>;
}

interface Metric {
  label: string;
  key: string;
  getValue: (s: BattleSession) => number;
  higherIsBetter: boolean;
}

const METRICS: Metric[] = [
  { label: "Vulns Found", key: "vulns", getValue: (s) => s.vulnerabilities.length, higherIsBetter: true },
  { label: "Critical", key: "critical", getValue: (s) => s.vulnerabilities.filter((v) => v.severity === "critical").length, higherIsBetter: true },
  { label: "Attack Chains", key: "chains", getValue: (s) => s.chains.length, higherIsBetter: true },
  { label: "Patched", key: "patched", getValue: (s) => s.vulnerabilities.filter((v) => v.patched).length, higherIsBetter: true },
  { label: "Verified", key: "verified", getValue: (s) => s.vulnerabilities.filter((v) => v.verified).length, higherIsBetter: true },
  { label: "Compliance", key: "compliance", getValue: (s) => s.compliance_score, higherIsBetter: true },
  { label: "Time (s)", key: "time", getValue: (s) => Math.round(Object.values(s.agent_timings).reduce((a, b) => a + b, 0)), higherIsBetter: false },
];

export function ComparisonBoard({ sessions }: Props) {
  const providers = Object.keys(sessions);

  // Calculate scores — each metric win = 1 point
  const scores: Record<string, number> = {};
  providers.forEach((p) => { scores[p] = 0; });

  METRICS.forEach((metric) => {
    const values = providers.map((p) => ({ provider: p, value: metric.getValue(sessions[p]) }));
    values.sort((a, b) => metric.higherIsBetter ? b.value - a.value : a.value - b.value);
    if (values.length > 0 && values[0].value > 0) {
      scores[values[0].provider] += 1;
    }
  });

  const sortedProviders = [...providers].sort((a, b) => scores[b] - scores[a]);
  const winner = sortedProviders[0];

  return (
    <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">
          Battle Royale Results
        </h2>
      </div>

      {/* Leaderboard */}
      <div className="flex items-center gap-4 mb-4">
        {sortedProviders.map((provider, idx) => (
          <div key={provider} className="flex items-center gap-2">
            <span className={clsx(
              "text-lg font-bold",
              idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-400" : "text-amber-700",
            )}>
              #{idx + 1}
            </span>
            <span className={clsx("text-xs font-bold uppercase", PROVIDER_COLORS[provider] || "text-slate-400")}>
              {provider}
            </span>
            <span className="text-[10px] text-slate-500">({scores[provider]} wins)</span>
            {idx === 0 && <Medal className="w-4 h-4 text-amber-400" />}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e1e2e]">
              <th className="text-left py-1.5 text-[10px] text-slate-500 uppercase">Metric</th>
              {providers.map((p) => (
                <th key={p} className={clsx("text-center py-1.5 text-[10px] uppercase font-bold", PROVIDER_COLORS[p])}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const values = providers.map((p) => metric.getValue(sessions[p]));
              const best = metric.higherIsBetter ? Math.max(...values) : Math.min(...values.filter((v) => v > 0));

              return (
                <tr key={metric.key} className="border-b border-[#1e1e2e]/50">
                  <td className="py-1.5 text-slate-400">{metric.label}</td>
                  {providers.map((p) => {
                    const val = metric.getValue(sessions[p]);
                    const isBest = val === best && val > 0;
                    return (
                      <td key={p} className={clsx("text-center py-1.5 font-mono", isBest ? "text-amber-400 font-bold" : "text-slate-400")}>
                        {val}
                        {isBest && " *"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
