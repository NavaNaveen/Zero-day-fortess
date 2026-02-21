"use client";

import type { BattlePhase } from "@/types/battle";
import { clsx } from "clsx";

interface Agent {
  codename: string;
  name: string;
  team: "red" | "blue";
  phase: BattlePhase[];
  description: string;
}

const AGENTS: Agent[] = [
  { codename: "Spider", name: "Recon Agent", team: "red", phase: ["recon"], description: "Maps attack surface" },
  { codename: "Blade", name: "Exploiter", team: "red", phase: ["assault"], description: "Executes payloads" },
  { codename: "Phantom", name: "Logic Hunter", team: "red", phase: ["assault"], description: "Business logic flaws" },
  { codename: "Venom", name: "Chain Builder", team: "red", phase: ["chaining"], description: "Chains vulnerabilities" },
  { codename: "Shield", name: "Patcher", team: "blue", phase: ["patching"], description: "Generates secure patches" },
  { codename: "Proof", name: "Verifier", team: "blue", phase: ["patching"], description: "Validates fixes" },
  { codename: "Fortress", name: "Hardening", team: "blue", phase: ["hardening"], description: "Systemic defenses" },
  { codename: "Auditor", name: "Compliance", team: "blue", phase: ["reporting"], description: "Compliance reports" },
];

interface Props {
  currentPhase: BattlePhase;
}

export function AgentStatus({ currentPhase }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {AGENTS.map((agent) => {
        const isActive = agent.phase.includes(currentPhase);
        const isDone =
          agent.team === "red"
            ? ["chaining", "patching", "hardening", "reporting", "complete"].includes(currentPhase) &&
              !agent.phase.includes(currentPhase)
            : ["complete"].includes(currentPhase);

        return (
          <div
            key={agent.codename}
            className={clsx(
              "flex items-center gap-2 p-2 rounded border text-xs font-mono transition-all duration-300",
              agent.team === "red"
                ? "border-red-500/20 bg-red-500/5"
                : "border-blue-500/20 bg-blue-500/5",
              isActive && agent.team === "red" && "border-red-400/60 bg-red-400/15 shadow-[0_0_10px_#ff336640]",
              isActive && agent.team === "blue" && "border-blue-400/60 bg-blue-400/15 shadow-[0_0_10px_#00d4ff40]"
            )}
          >
            <span
              className={clsx(
                "w-2 h-2 rounded-full flex-shrink-0",
                isActive && agent.team === "red" && "bg-red-400 animate-pulse",
                isActive && agent.team === "blue" && "bg-blue-400 animate-pulse",
                isDone && "bg-green-400",
                !isActive && !isDone && agent.team === "red" && "bg-red-900",
                !isActive && !isDone && agent.team === "blue" && "bg-blue-900"
              )}
            />
            <div className="min-w-0">
              <div className={clsx("font-bold text-xs", agent.team === "red" ? "text-red-400" : "text-blue-400")}>
                {agent.codename}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{agent.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
