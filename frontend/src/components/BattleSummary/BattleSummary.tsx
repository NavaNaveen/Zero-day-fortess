"use client";

import type { BattleSession } from "@/types/battle";
import { ShieldCheck, Bug, Link2, FileCheck, Clock, TrendingUp, GitPullRequest, ExternalLink } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  session: BattleSession;
}

export function BattleSummary({ session }: Props) {
  if (session.state !== "complete") return null;

  const vulnCount = session.vulnerabilities.length;
  const patchedCount = session.vulnerabilities.filter((v) => v.patched).length;
  const verifiedCount = session.vulnerabilities.filter((v) => v.verified).length;
  const criticalCount = session.vulnerabilities.filter((v) => v.severity === "critical").length;
  const prUrl = session.patches.find((p) => p.pr_url)?.pr_url ?? "";
  const report = session.compliance_report;
  const executive = (report?.executive_summary as string) ?? "";
  const recommendations = (report?.recommendations as string[]) ?? [];
  const riskReduction = (report?.risk_reduction_pct as number) ?? 0;
  const scoreBefore = (report?.compliance_score_before as number) ?? 0;
  const scoreAfter = (report?.compliance_score_after as number) ?? 0;

  // Calculate total battle time
  const started = new Date(session.started_at).getTime();
  const completed = session.completed_at ? new Date(session.completed_at).getTime() : Date.now();
  const durationSec = Math.round((completed - started) / 1000);
  const durationMin = Math.floor(durationSec / 60);
  const durationRemSec = durationSec % 60;

  return (
    <div className="border border-emerald-500/30 bg-emerald-500/5 rounded p-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
          Battle Complete — Executive Summary
        </h2>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <div className="text-center">
          <Bug className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-400">{vulnCount}</div>
          <div className="text-[10px] text-slate-500">Found</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-500">{criticalCount}</div>
          <div className="text-[10px] text-slate-500">Critical</div>
        </div>
        <div className="text-center">
          <Link2 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-purple-400">{session.chains.length}</div>
          <div className="text-[10px] text-slate-500">Chains</div>
        </div>
        <div className="text-center">
          <FileCheck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-amber-400">{patchedCount}</div>
          <div className="text-[10px] text-slate-500">Patched</div>
        </div>
        <div className="text-center">
          <ShieldCheck className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{verifiedCount}</div>
          <div className="text-[10px] text-slate-500">Verified</div>
        </div>
        <div className="text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-400">{durationMin}:{String(durationRemSec).padStart(2, "0")}</div>
          <div className="text-[10px] text-slate-500">Duration</div>
        </div>
      </div>

      {/* Compliance delta bar */}
      <div className="flex items-center gap-3 mb-4 p-2 rounded bg-[#111118]">
        <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Compliance: {scoreBefore}</span>
            <span>{scoreAfter}</span>
          </div>
          <div className="w-full h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all duration-1000 rounded-full"
              style={{ width: `${scoreAfter}%` }}
            />
          </div>
        </div>
        {riskReduction > 0 && (
          <span className="text-green-400 text-xs font-bold whitespace-nowrap">-{riskReduction}% risk</span>
        )}
      </div>

      {/* Executive summary */}
      {executive && (
        <div className="text-xs text-slate-300 mb-3 leading-relaxed">
          {executive}
        </div>
      )}

      {/* Top recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Top Recommendations</div>
          <ul className="text-xs text-slate-400 space-y-1">
            {recommendations.slice(0, 5).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 flex-shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Agent timings */}
      {Object.keys(session.agent_timings).length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1e1e2e]">
          <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Agent Performance</div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {Object.entries(session.agent_timings).map(([agent, time]) => (
              <span
                key={agent}
                className={clsx(
                  "px-2 py-0.5 rounded border",
                  ["Spider", "Blade", "Phantom", "Venom"].includes(agent)
                    ? "border-red-500/20 text-red-400"
                    : "border-blue-500/20 text-blue-400"
                )}
              >
                {agent}: {time}s
              </span>
            ))}
          </div>
        </div>
      )}

      {/* GitHub PR link */}
      {prUrl && (
        <div className="mt-3 pt-3 border-t border-[#1e1e2e]">
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-xs font-bold"
          >
            <GitPullRequest className="w-4 h-4" />
            View Pull Request
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
