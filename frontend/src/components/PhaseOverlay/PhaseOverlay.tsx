"use client";

import { useEffect, useState } from "react";
import type { BattlePhase } from "@/types/battle";
import { clsx } from "clsx";
import { Crosshair, Swords, Link2, Wrench, ShieldCheck, FileText, Trophy } from "lucide-react";

const phaseConfig: Record<string, { label: string; team: "red" | "blue" | "neutral"; icon: React.ReactNode }> = {
  recon: { label: "RECONNAISSANCE", team: "red", icon: <Crosshair className="w-10 h-10" /> },
  assault: { label: "ASSAULT", team: "red", icon: <Swords className="w-10 h-10" /> },
  chaining: { label: "CHAIN ANALYSIS", team: "red", icon: <Link2 className="w-10 h-10" /> },
  patching: { label: "PATCHING", team: "blue", icon: <Wrench className="w-10 h-10" /> },
  hardening: { label: "HARDENING", team: "blue", icon: <ShieldCheck className="w-10 h-10" /> },
  reporting: { label: "COMPLIANCE REPORT", team: "neutral", icon: <FileText className="w-10 h-10" /> },
  complete: { label: "BATTLE COMPLETE", team: "neutral", icon: <Trophy className="w-10 h-10" /> },
};

interface Props {
  phase: BattlePhase | null;
}

export function PhaseOverlay({ phase }: Props) {
  const [visible, setVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BattlePhase | null>(null);

  useEffect(() => {
    if (phase && phase !== "idle" && phaseConfig[phase]) {
      setCurrentPhase(phase);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (!visible || !currentPhase || !phaseConfig[currentPhase]) return null;

  const config = phaseConfig[currentPhase];

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none",
        "animate-phaseIn"
      )}
    >
      {/* Backdrop */}
      <div
        className={clsx(
          "absolute inset-0 opacity-80",
          config.team === "red" && "bg-gradient-to-b from-red-950/90 via-black to-red-950/90",
          config.team === "blue" && "bg-gradient-to-b from-blue-950/90 via-black to-blue-950/90",
          config.team === "neutral" && "bg-gradient-to-b from-emerald-950/90 via-black to-emerald-950/90"
        )}
      />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={clsx(
          "w-full h-1 animate-phaseScan",
          config.team === "red" ? "bg-red-500/40" : config.team === "blue" ? "bg-blue-500/40" : "bg-emerald-500/40"
        )} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 animate-phaseScale">
        <div className={clsx(
          config.team === "red" && "text-red-400",
          config.team === "blue" && "text-blue-400",
          config.team === "neutral" && "text-emerald-400"
        )}>
          {config.icon}
        </div>
        <div className={clsx(
          "text-3xl font-bold tracking-[0.3em] font-mono animate-glitch",
          config.team === "red" && "text-red-400",
          config.team === "blue" && "text-blue-400",
          config.team === "neutral" && "text-emerald-400"
        )}>
          {config.label}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-[0.5em]">
          {config.team === "red" ? "Red Team Active" : config.team === "blue" ? "Blue Team Active" : "Phase Complete"}
        </div>
      </div>
    </div>
  );
}
