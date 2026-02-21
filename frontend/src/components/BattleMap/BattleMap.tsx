"use client";

import type { BattlePhase } from "@/types/battle";
import { clsx } from "clsx";

const PHASES: { key: BattlePhase; label: string; team: "red" | "blue" | "neutral" }[] = [
  { key: "recon", label: "Recon", team: "red" },
  { key: "assault", label: "Assault", team: "red" },
  { key: "chaining", label: "Chaining", team: "red" },
  { key: "patching", label: "Patching", team: "blue" },
  { key: "hardening", label: "Hardening", team: "blue" },
  { key: "reporting", label: "Report", team: "neutral" },
  { key: "complete", label: "Done", team: "neutral" },
];

const PHASE_ORDER = ["idle", "recon", "assault", "chaining", "patching", "hardening", "reporting", "complete"];

interface Props {
  currentPhase: BattlePhase;
}

export function BattleMap({ currentPhase }: Props) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto">
      {PHASES.map((phase, i) => {
        const phaseIdx = PHASE_ORDER.indexOf(phase.key);
        const isDone = phaseIdx < currentIdx;
        const isActive = phase.key === currentPhase;

        return (
          <div key={phase.key} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={clsx(
                "px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all duration-500",
                isActive && phase.team === "red" && "border-red-400 bg-red-400/20 text-red-300 shadow-[0_0_10px_#ff336640]",
                isActive && phase.team === "blue" && "border-blue-400 bg-blue-400/20 text-blue-300 shadow-[0_0_10px_#00d4ff40]",
                isActive && phase.team === "neutral" && "border-green-400 bg-green-400/20 text-green-300",
                isDone && "border-green-500/30 bg-green-500/10 text-green-400",
                !isActive && !isDone && "border-slate-700 text-slate-600"
              )}
            >
              {isDone ? "✓ " : isActive ? "▶ " : ""}
              {phase.label}
            </div>
            {i < PHASES.length - 1 && (
              <div className={clsx("w-3 h-px", isDone ? "bg-green-500/50" : "bg-slate-700")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
