"use client";

import type { BattlePhase } from "@/types/battle";
import { Clock } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  agentTimings: Record<string, number>;
  currentPhase: BattlePhase;
}

interface AgentInfo {
  codename: string;
  name: string;
  team: "red" | "blue";
  phases: BattlePhase[];
}

const AGENTS: AgentInfo[] = [
  { codename: "SPIDER", name: "Recon", team: "red", phases: ["recon"] },
  { codename: "BLADE", name: "Exploit", team: "red", phases: ["assault"] },
  { codename: "PHANTOM", name: "Logic", team: "red", phases: ["assault"] },
  { codename: "VENOM", name: "Chains", team: "red", phases: ["chaining"] },
  { codename: "SHIELD", name: "Patcher", team: "blue", phases: ["patching"] },
  { codename: "PROOF", name: "Verifier", team: "blue", phases: ["patching"] },
  { codename: "FORTRESS", name: "Hardening", team: "blue", phases: ["hardening"] },
  { codename: "AUDITOR", name: "Compliance", team: "blue", phases: ["reporting"] },
];

export function AgentTimeline({ agentTimings, currentPhase }: Props) {
  const maxTime = Math.max(1, ...Object.values(agentTimings));
  const totalTime = Object.values(agentTimings).reduce((a, b) => a + b, 0);

  // Determine which agents are currently running based on phase
  const activePhases = new Set<BattlePhase>([currentPhase]);

  return (
    <div className="border border-[#1e1e2e] rounded p-3 animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Agent Execution Timeline</span>
        </div>
        {totalTime > 0 && (
          <span className="text-[9px] text-slate-600">
            Total: <span className="text-slate-400 font-bold">{totalTime.toFixed(1)}s</span>
          </span>
        )}
      </div>

      {/* Team labels */}
      <div className="flex items-center gap-4 mb-2 text-[9px]">
        <span className="text-red-400 font-bold">RED TEAM</span>
        <span className="text-slate-600">|</span>
        <span className="text-blue-400 font-bold">BLUE TEAM</span>
      </div>

      <div className="space-y-1">
        {AGENTS.map((agent) => {
          const time = agentTimings[agent.codename.toLowerCase()] ?? agentTimings[agent.codename] ?? 0;
          const pct = maxTime > 0 ? (time / maxTime) * 100 : 0;
          const isActive = agent.phases.some((p) => activePhases.has(p)) && currentPhase !== "idle" && currentPhase !== "complete";
          const isDone = time > 0;

          return (
            <div key={agent.codename} className="flex items-center gap-2 h-6">
              {/* Agent label */}
              <div className={clsx(
                "w-20 text-[9px] font-bold truncate",
                agent.team === "red" ? "text-red-400" : "text-blue-400",
              )}>
                {agent.codename}
              </div>

              {/* Timeline bar */}
              <div className="flex-1 h-4 bg-[#111118] rounded overflow-hidden relative">
                {(isDone || isActive) && (
                  <div
                    className={clsx(
                      "h-full rounded transition-all duration-500",
                      agent.team === "red"
                        ? "bg-gradient-to-r from-red-600 to-red-400"
                        : "bg-gradient-to-r from-blue-600 to-blue-400",
                      isActive && !isDone && "animate-pulse",
                    )}
                    style={{ width: isActive && !isDone ? "100%" : `${Math.max(pct, 5)}%`, opacity: isActive && !isDone ? 0.4 : 1 }}
                  />
                )}
                {isActive && !isDone && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={clsx(
                      "text-[8px] font-bold animate-pulse",
                      agent.team === "red" ? "text-red-300" : "text-blue-300",
                    )}>
                      RUNNING
                    </span>
                  </div>
                )}
              </div>

              {/* Time label */}
              <div className="w-12 text-right text-[9px] text-slate-600 font-mono">
                {isDone ? `${time.toFixed(1)}s` : isActive ? "..." : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
