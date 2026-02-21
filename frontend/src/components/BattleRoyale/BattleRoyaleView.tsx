"use client";

import type { BattleSession } from "@/types/battle";
import { PROVIDER_COLORS, PROVIDER_BG } from "@/components/ProviderSelector/ProviderSelector";
import { ComparisonBoard } from "./ComparisonBoard";
import { Shield, Swords, Bug, Link2, FileCheck, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  sessions: Record<string, BattleSession>;
  providers: string[];
}

const PHASE_LABELS: Record<string, string> = {
  idle: "IDLE",
  recon: "RECON",
  assault: "ASSAULT",
  chaining: "CHAINING",
  patching: "PATCHING",
  hardening: "HARDENING",
  reporting: "REPORTING",
  complete: "COMPLETE",
};

export function BattleRoyaleView({ sessions, providers }: Props) {
  const allComplete = providers.every((p) => sessions[p]?.state === "complete");

  return (
    <div className="space-y-4">
      {/* Battle Grid */}
      <div className={clsx(
        "grid gap-3",
        providers.length <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2",
      )}>
        {providers.map((provider) => {
          const session = sessions[provider];
          if (!session) {
            return (
              <div key={provider} className={clsx("border rounded p-3", PROVIDER_BG[provider] || "border-slate-700")}>
                <div className={clsx("text-xs font-bold uppercase", PROVIDER_COLORS[provider] || "text-slate-400")}>
                  {provider}
                </div>
                <div className="text-slate-600 text-[10px] mt-2">Waiting to start...</div>
              </div>
            );
          }

          const isActive = session.state !== "idle" && session.state !== "complete";
          const vulnCount = session.vulnerabilities.length;
          const critCount = session.vulnerabilities.filter((v) => v.severity === "critical").length;
          const patchedCount = session.vulnerabilities.filter((v) => v.patched).length;
          const verifiedCount = session.vulnerabilities.filter((v) => v.verified).length;

          return (
            <div
              key={provider}
              className={clsx(
                "border rounded p-3 transition-all",
                PROVIDER_BG[provider] || "border-slate-700",
                isActive && "shadow-lg",
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={clsx("text-xs font-bold uppercase", PROVIDER_COLORS[provider] || "text-slate-400")}>
                    {provider}
                  </span>
                  {session.provider_model && (
                    <span className="text-[9px] text-slate-600">{session.provider_model}</span>
                  )}
                </div>
                <span className={clsx(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  session.state === "complete" ? "text-green-400 bg-green-500/10" :
                    isActive ? "text-amber-400 bg-amber-500/10 animate-pulse" :
                      "text-slate-500",
                )}>
                  {PHASE_LABELS[session.state] || session.state}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center">
                  <Bug className="w-3 h-3 text-red-400 mx-auto mb-0.5" />
                  <div className="text-sm font-bold text-red-400">{vulnCount}</div>
                  <div className="text-[8px] text-slate-600">Found</div>
                </div>
                <div className="text-center">
                  <Link2 className="w-3 h-3 text-purple-400 mx-auto mb-0.5" />
                  <div className="text-sm font-bold text-purple-400">{session.chains.length}</div>
                  <div className="text-[8px] text-slate-600">Chains</div>
                </div>
                <div className="text-center">
                  <FileCheck className="w-3 h-3 text-amber-400 mx-auto mb-0.5" />
                  <div className="text-sm font-bold text-amber-400">{patchedCount}</div>
                  <div className="text-[8px] text-slate-600">Patched</div>
                </div>
                <div className="text-center">
                  <ShieldCheck className="w-3 h-3 text-green-400 mx-auto mb-0.5" />
                  <div className="text-sm font-bold text-green-400">{verifiedCount}</div>
                  <div className="text-[8px] text-slate-600">Verified</div>
                </div>
              </div>

              {/* Mini War Log */}
              <div className="space-y-0.5 max-h-28 overflow-y-auto">
                {session.log.slice(-8).reverse().map((line, i) => (
                  <div key={i} className={clsx(
                    "text-[9px] truncate",
                    line.includes("Spider") && "text-yellow-500",
                    (line.includes("Blade") || line.includes("Phantom") || line.includes("Venom")) && "text-red-400",
                    (line.includes("Shield") || line.includes("Proof") || line.includes("Fortress") || line.includes("Auditor")) && "text-blue-400",
                    line.includes("War General") && "text-slate-400",
                    line.includes("✅") && "text-green-400",
                  )}>
                    {line}
                  </div>
                ))}
                {session.log.length === 0 && (
                  <div className="text-slate-700 text-[9px]">Waiting...</div>
                )}
              </div>

              {/* Compliance score */}
              {session.state === "complete" && session.compliance_score > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1e1e2e] flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">Compliance</span>
                  <span className={clsx(
                    "text-xs font-bold",
                    session.compliance_score >= 80 ? "text-green-400" : session.compliance_score >= 60 ? "text-amber-400" : "text-red-400",
                  )}>
                    {session.compliance_score}/100
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison Board (after all complete) */}
      {allComplete && Object.keys(sessions).length >= 2 && (
        <ComparisonBoard sessions={sessions} />
      )}
    </div>
  );
}
