"use client";

import { useBattle } from "@/hooks/useBattle";
import { useBattleRoyale } from "@/hooks/useBattleRoyale";
import { AgentStatus } from "@/components/AgentStatus/AgentStatus";
import { BattleMap } from "@/components/BattleMap/BattleMap";
import { VulnerabilityCard } from "@/components/VulnerabilityCard/VulnerabilityCard";
import { AttackChainCard } from "@/components/AttackChain/AttackChain";
import { ComplianceScore } from "@/components/ComplianceScore/ComplianceScore";
import { PhaseOverlay } from "@/components/PhaseOverlay/PhaseOverlay";
import { AgentTerminal } from "@/components/AgentTerminal/AgentTerminal";
import { BootSequence } from "@/components/BootSequence/BootSequence";
import { BattleSummary } from "@/components/BattleSummary/BattleSummary";
import { ProviderSelector } from "@/components/ProviderSelector/ProviderSelector";
import { GitHubInput } from "@/components/GitHubInput/GitHubInput";
import { BattleRoyaleView } from "@/components/BattleRoyale/BattleRoyaleView";
import { VulnRace } from "@/components/BattleRoyale/VulnRace";
import { DebateArena } from "@/components/CrossExamination/DebateArena";
import { AttackGraph } from "@/components/AttackGraph/AttackGraph";
import { HardeningPanel } from "@/components/HardeningPanel/HardeningPanel";
import { AgentTimeline } from "@/components/AgentTimeline/AgentTimeline";
import { Shield, Swords, WifiOff, Play, Activity, Volume2, VolumeX, Zap, Target } from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect, useCallback } from "react";
import { toggleMute, isMuted } from "@/utils/audio";
import type { LLMProvider } from "@/types/battle";

type BattleMode = "single" | "royale";

export default function Dashboard() {
  const battle = useBattle();
  const royale = useBattleRoyale();

  const [mode, setMode] = useState<BattleMode>("single");
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>(["ollama"]);
  const [githubUrl, setGithubUrl] = useState("");
  const [muted, setMuted] = useState(() => typeof window !== "undefined" ? isMuted() : false);

  // Determine active state based on mode
  const session = battle.session;
  const connected = mode === "royale" ? royale.connected : battle.connected;
  const isStarting = mode === "royale" ? royale.isStarting : battle.isStarting;

  const isActive = mode === "single"
    ? !!(session?.state && session.state !== "idle" && session.state !== "complete")
    : royale.providers.length > 0 && !royale.allComplete;

  // Single battle stats
  const criticalCount = session?.vulnerabilities.filter((v) => v.severity === "critical").length ?? 0;
  const highCount = session?.vulnerabilities.filter((v) => v.severity === "high").length ?? 0;
  const patchedCount = session?.vulnerabilities.filter((v) => v.patched).length ?? 0;
  const verifiedCount = session?.vulnerabilities.filter((v) => v.verified).length ?? 0;

  // Battle elapsed timer
  const [elapsed, setElapsed] = useState(0);
  const singleActive = !!(session?.state && session.state !== "idle" && session.state !== "complete");

  useEffect(() => {
    if (!singleActive) return;
    const start = session?.started_at ? new Date(session.started_at).getTime() : Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [singleActive, session?.started_at]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Battle progress
  const phaseOrder = ["recon", "assault", "chaining", "patching", "hardening", "reporting", "complete"];
  const currentPhaseIdx = session?.state ? phaseOrder.indexOf(session.state) : -1;
  const progressPct = currentPhaseIdx >= 0 ? Math.round(((currentPhaseIdx + 1) / phaseOrder.length) * 100) : 0;

  const handleLaunch = useCallback(() => {
    if (mode === "single") {
      const provider = selectedProviders[0] || "ollama";
      battle.launch(provider, githubUrl);
    } else {
      if (selectedProviders.length < 2) return;
      royale.launchRoyale(selectedProviders, githubUrl);
    }
  }, [mode, selectedProviders, githubUrl, battle, royale]);

  const canLaunch = mode === "single"
    ? selectedProviders.length >= 1
    : selectedProviders.length >= 2;

  const launchDisabled = isStarting
    || !canLaunch
    || (mode === "single" && (session?.state === "recon" || session?.state === "assault"));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0f0] font-mono">
      <BootSequence />
      <PhaseOverlay phase={battle.phaseTransition} />

      {/* Header */}
      <header className="relative border-b border-[#1e1e2e] px-4 py-3 flex items-center justify-between overflow-hidden">
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-phaseScan" />
          </div>
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <Shield className="w-6 h-6 text-blue-400" />
            {isActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-lg font-bold tracking-wider">
            <span className="text-red-400">ZERO</span>
            <span className="text-white"> DAY </span>
            <span className="text-blue-400">FORTRESS</span>
          </span>
          <span className="text-[10px] text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded">
            {mode === "royale" ? "BATTLE ROYALE" : "AI RED vs BLUE"}
          </span>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-1.5 text-xs">
            {connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-green-400">LIVE</span>
              </>
            ) : (
              <><WifiOff className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-500">OFFLINE</span></>
            )}
          </div>

          {mode === "single" && singleActive && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-amber-400 font-mono tabular-nums">{formatTime(elapsed)}</span>
              <div className="w-24 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className={clsx(
                "text-[10px] font-bold uppercase",
                ["recon", "assault", "chaining"].includes(session?.state ?? "") ? "text-red-400" : "text-blue-400"
              )}>
                {session?.state}
              </span>
            </div>
          )}

          {session?.state === "complete" && mode === "single" && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-green-400 font-bold">COMPLETE</span>
            </div>
          )}

          <button
            onClick={() => setMuted(toggleMute())}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLaunch}
            disabled={launchDisabled}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all",
              mode === "royale"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:shadow-[0_0_15px_#f59e0b40]"
                : "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_#ff336640]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {mode === "royale" ? <Zap className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isStarting ? "LAUNCHING..." : mode === "royale" ? "START ROYALE" : "START BATTLE"}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Control Bar */}
        <div className="border border-[#1e1e2e] rounded p-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode("single")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold border transition-all",
                  mode === "single"
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-slate-700 text-slate-600 hover:text-slate-400",
                )}
              >
                <Target className="w-3 h-3" />
                SINGLE BATTLE
              </button>
              <button
                onClick={() => setMode("royale")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold border transition-all",
                  mode === "royale"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-slate-700 text-slate-600 hover:text-slate-400",
                )}
              >
                <Zap className="w-3 h-3" />
                BATTLE ROYALE
              </button>
            </div>

            {/* Provider Selector */}
            <ProviderSelector
              selected={selectedProviders}
              onChange={setSelectedProviders}
              multi={mode === "royale"}
            />
          </div>

          {/* GitHub Input */}
          <GitHubInput onSubmit={setGithubUrl} />
          {githubUrl && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-slate-500">Target:</span>
              <span className="text-blue-400 font-mono">{githubUrl}</span>
              <button
                onClick={() => setGithubUrl("")}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                [clear]
              </button>
            </div>
          )}

          {mode === "royale" && selectedProviders.length < 2 && (
            <div className="text-amber-400 text-[10px]">
              Select at least 2 providers for Battle Royale
            </div>
          )}
        </div>

        {/* SINGLE BATTLE MODE */}
        {mode === "single" && (
          <>
            <div className="border border-[#1e1e2e] rounded p-3">
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">Battle Phase</div>
              <BattleMap currentPhase={session?.state ?? "idle"} />
            </div>

            {/* Live Attack Surface Graph */}
            {session && <AttackGraph session={session} />}

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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="border border-[#1e1e2e] rounded p-3">
                <div className="text-[10px] text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Agents
                </div>
                <div className="mb-2 text-[10px]">
                  <span className="text-red-400 font-bold">RED TEAM</span>
                </div>
                <AgentStatus currentPhase={session?.state ?? "idle"} />

                {session && (
                  <div className="mt-4">
                    <ComplianceScore
                      score={session.compliance_score}
                      delta={session.compliance_delta}
                      report={session.compliance_report}
                    />
                  </div>
                )}

                {/* Hardening Command Center */}
                {session && session.hardening_actions?.length > 0 && (
                  <div className="mt-4">
                    <HardeningPanel
                      actions={session.hardening_actions}
                      scoreImprovement={session.security_score_improvement ?? 0}
                    />
                  </div>
                )}
              </div>

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
                    <VulnerabilityCard
                      key={v.id}
                      vuln={v}
                      patch={session.patches.find((p) => p.vulnerability_id === v.id)}
                    />
                  ))}
                </div>
              </div>

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

            {/* Agent Execution Timeline */}
            {session && Object.keys(session.agent_timings).length > 0 && (
              <AgentTimeline
                agentTimings={session.agent_timings}
                currentPhase={session.state}
              />
            )}

            {session && <BattleSummary session={session} />}
            <AgentTerminal thoughts={battle.agentThoughts} />
          </>
        )}

        {/* BATTLE ROYALE MODE */}
        {mode === "royale" && (
          <>
            {royale.providers.length > 0 ? (
              <BattleRoyaleView
                sessions={royale.sessions}
                providers={royale.providers}
              />
            ) : (
              <div className="border border-[#1e1e2e] rounded p-8 text-center">
                <Zap className="w-8 h-8 text-amber-400/30 mx-auto mb-3" />
                <div className="text-slate-500 text-sm mb-2">Select providers and start a Battle Royale</div>
                <div className="text-slate-600 text-xs">
                  Multiple AI models will battle simultaneously against the same target.
                  <br />
                  After all battles complete, AIs will cross-examine each other&apos;s findings.
                </div>
              </div>
            )}

            {/* VulnRace — Racing Bar Chart */}
            {royale.providers.length > 0 && (
              <VulnRace
                sessions={royale.sessions}
                providers={royale.providers}
              />
            )}

            {(royale.examRounds.length > 0 || royale.examActive) && (
              <DebateArena rounds={royale.examRounds} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
