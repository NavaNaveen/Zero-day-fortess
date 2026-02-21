"use client";

import type { AttackChain } from "@/types/battle";
import { severityColor } from "@/utils/severity";
import { clsx } from "clsx";
import { Link2 } from "lucide-react";

interface Props {
  chain: AttackChain;
}

export function AttackChainCard({ chain }: Props) {
  return (
    <div className="border border-purple-500/20 bg-purple-500/5 rounded p-3 text-xs font-mono">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-bold text-purple-300">{chain.title}</span>
        </div>
        <span className={clsx("px-1.5 py-0.5 rounded border text-[10px] uppercase font-bold", severityColor[chain.combined_severity])}>
          {chain.combined_severity}
        </span>
      </div>

      <ol className="space-y-1 mb-2">
        {chain.steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-slate-400">
            <span className="text-purple-500 flex-shrink-0">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="text-purple-400 text-[10px]">
        Outcome: <span className="text-white">{chain.outcome}</span>
      </div>
      <div className="text-slate-600 text-[10px] mt-1">
        CVSS {chain.combined_cvss.toFixed(1)} — discovered by {chain.discovered_by}
      </div>
    </div>
  );
}
