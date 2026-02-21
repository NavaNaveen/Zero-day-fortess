"use client";

import { useBattle } from "@/hooks/useBattle";
import { AgentStatus } from "@/components/AgentStatus/AgentStatus";
import { BattleMap } from "@/components/BattleMap/BattleMap";
import { VulnerabilityCard } from "@/components/VulnerabilityCard/VulnerabilityCard";
import { AttackChainCard } from "@/components/AttackChain/AttackChain";
import { ComplianceScore } from "@/components/ComplianceScore/ComplianceScore";
import { Shield, Swords, Wifi, WifiOff, Play, Activity } from "lucide-react";
import { clsx } from "clsx";

export default function Dashboard() {
  const { session, events, connected, isStarting, launch } = useBattle();

  const criticalCount = session?.vulnerabilities.filter((v) => v.severity === "critical").length ?? 0;
  const highCount = session?.vulnerabilities.filter((v) => v.severity === "high").length ?? 0;
  const patchedCount = session?.vulnerabilities.filter((v) => v.patched).length ?? 0;
  const verifiedCount = session?.vulnerabilities.filter((v) => v.verified).length ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0f0] font-mono">
      {/* ── Header ── */}
      <header className="border-b border-[#1e1e2e] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <span className="text-lg font-bold tracking-wider">
            <span className="text-red-400">ZERO</span>
            <span className="text-white"> DAY </span>
            <span className="text-blue-400">FORTRESS</span>
          </span>
          <span className="text-[10px] text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded">
            AI RED vs BLUE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {connected ? (
              <><Wifi className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">LIVE</span></>
            ) : (
              <><WifiOff className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-500">OFFLINE</span></>
            )}
          </div>

          <button
            onClick={launch}
            disabled={isStarting || session?.state === "recon" || session?.state === "assault"}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all",
              "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_#ff336640]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            {isStarting ? "LAUNCHING..." : "START BATTLE"}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* ── Battle Phase Map ── */}
        <div className="border border-[#1e1e2e] rounded p-3">
          <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">Battle Phase</div>
          <BattleMap currentPhase={session?.state ?? "idle"} />
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Vulns Found", value: session?.vulnerabilities.length ?? 0, color: "text-red-400" },
            { label: "Critical", value: criticalCount, color: "text-red-500" },
            { label: "High", value: highCount, color: "text-orange-400" },
            { label: "Chains", value: session?.chains.length ?? 0, color: "text-purple-400" },
            { label: "Patched", value: patchedCount, color: "text-amber-400" },
            { label: "Verified", value: verifiedCount, color: "text-green-400" },
          ].map((stat) => (
            <div key={stat.label} className="border border-[#1e1e2e] rounded p-3 text-center">
              <div className={clsx("text-2xl font-bold", stat.color)}>{stat.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Agents sidebar */}
          <div className="border border-[#1e1e2e] rounded p-3">
            <div className="text-[10px] text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Agents
            </div>
            <div className="mb-2 text-[10px]">
              <span className="text-red-400 font-bold">🔴 RED TEAM</span>
            </div>
            <AgentStatus currentPhase={session?.state ?? "idle"} />

            {session && (
              <div className="mt-4">
                <ComplianceScore
                  score={session.compliance_score}
                  delta={session.compliance_delta}
                />
              </div>
            )}
          </div>

          {/* Vulnerabilities */}
          <div className="lg:col-span-2 border border-[#1e1e2e] rounded p-3">
            <div className="text-[10px] text-slate-500 mb-3 uppercase tracking-widest">
              <Swords className="inline w-3 h-3 mr-1" />
              Vulnerabilities ({session?.vulnerabilities.length ?? 0})
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {session?.vulnerabilities.length === 0 && (
                <div className="text-slate-600 text-xs text-center py-8">
                  {session?.state === "idle" ? "Start a battle to begin scanning..." : "Scanning..."}
                </div>
              )}
              {session?.vulnerabilities.map((v) => (
                <VulnerabilityCard key={v.id} vuln={v} />
              ))}
            </div>
          </div>

          {/* Attack Chains + Live Log */}
          <div className="space-y-3">
            <div className="border border-[#1e1e2e] rounded p-3">
              <div className="text-[10px] text-slate-500 mb-3 uppercase tracking-widest">
                Attack Chains ({session?.chains.length ?? 0})
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {session?.chains.length === 0 ? (
                  <div className="text-slate-600 text-xs text-center py-4">No chains yet</div>
                ) : (
                  session?.chains.map((c) => <AttackChainCard key={c.id} chain={c} />)
                )}
              </div>
            </div>

            {/* Live Log */}
            <div className="border border-[#1e1e2e] rounded p-3">
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">War Log</div>
              <div className="space-y-0.5 max-h-52 overflow-y-auto">
                {session?.log.slice(-30).reverse().map((line, i) => (
                  <div key={i} className={clsx(
                    "text-[10px]",
                    line.includes("Spider") && "text-yellow-500",
                    line.includes("Blade") || line.includes("Phantom") || line.includes("Venom") ? "text-red-400" : "",
                    line.includes("Shield") || line.includes("Proof") || line.includes("Fortress") || line.includes("Auditor") ? "text-blue-400" : "",
                    line.includes("War General") && "text-slate-300",
                    line.includes("✅") && "text-green-400",
                    line.includes("❌") && "text-red-500",
                  )}>
                    {line}
                  </div>
                ))}
                {(!session || session.log.length === 0) && (
                  <div className="text-slate-700 text-[10px]">Awaiting battle start...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
