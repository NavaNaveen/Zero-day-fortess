"use client";

import type { ExamRound } from "@/types/battle";
import { PROVIDER_COLORS } from "@/components/ProviderSelector/ProviderSelector";
import { useTypewriter } from "@/hooks/useTypewriter";
import { Swords, Shield, MessageSquare } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  rounds: ExamRound[];
}

const VERDICT_STYLE: Record<string, string> = {
  agree: "text-green-400 bg-green-500/10 border-green-500/30",
  dispute: "text-red-400 bg-red-500/10 border-red-500/30",
  partial: "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

const RESPONSE_STYLE: Record<string, string> = {
  defend: "text-blue-400",
  partially_concede: "text-amber-400",
  concede: "text-red-400",
};

function str(val: unknown): string {
  return typeof val === "string" ? val : String(val ?? "");
}

/** Typewriter text block with blinking cursor */
function TypewriterBlock({ text, delay }: { text: string; delay: number }) {
  const { displayText, isTyping, skip } = useTypewriter(text, delay);

  return (
    <span onClick={skip} className="cursor-pointer" title="Click to skip">
      {displayText}
      {isTyping && <span className="inline-block w-[2px] h-3 bg-cyan-400 ml-0.5 animate-blink align-text-bottom" />}
    </span>
  );
}

/** A single debate round — latest round gets typewriter effect */
function DebateRound({ round, isLatest }: { round: ExamRound; isLatest: boolean }) {
  const verdict = str(round.challenge.verdict);
  const argument = str(round.challenge.argument);
  const patchScore = round.challenge.patch_quality_score;
  const defenseText = str(round.defense.defense || round.defense.response);
  const response = str(round.defense.response);
  const lesson = str(round.defense.lesson_learned);

  return (
    <div className="border border-[#1e1e2e] rounded p-3">
      {/* Round header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">ROUND {round.round}</span>
          <span className="text-xs text-slate-400">
            <span className="text-red-400">[{round.vulnerability.severity.toUpperCase()}]</span>{" "}
            {round.vulnerability.title}
          </span>
        </div>
        {verdict && (
          <span className={clsx(
            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase animate-verdictPop",
            VERDICT_STYLE[verdict] || "text-slate-400",
          )}>
            {verdict}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Challenger */}
        <div className="space-y-2 animate-debateLeft">
          <div className="flex items-center gap-1.5">
            <Swords className="w-3 h-3 text-red-400" />
            <span className={clsx("text-[10px] font-bold uppercase", PROVIDER_COLORS[round.challenger] || "text-slate-400")}>
              {round.challenger} challenges
            </span>
          </div>
          <div className="bg-[#0a0a0f] rounded p-2 text-[10px] text-slate-300 leading-relaxed border border-red-500/10 min-h-[3rem]">
            {isLatest ? (
              <TypewriterBlock text={argument || "..."} delay={15} />
            ) : (
              argument || "..."
            )}
          </div>
          {patchScore != null && (
            <div className="text-[9px] text-slate-500">
              Patch quality: <span className="text-amber-400 font-bold">{String(patchScore)}/10</span>
            </div>
          )}
        </div>

        {/* Defender */}
        <div className="space-y-2 animate-debateRight">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-blue-400" />
            <span className={clsx("text-[10px] font-bold uppercase", PROVIDER_COLORS[round.defender] || "text-slate-400")}>
              {round.defender} defends
            </span>
          </div>
          <div className="bg-[#0a0a0f] rounded p-2 text-[10px] text-slate-300 leading-relaxed border border-blue-500/10 min-h-[3rem]">
            {isLatest ? (
              <TypewriterBlock text={defenseText || "..."} delay={15} />
            ) : (
              defenseText || "..."
            )}
          </div>
          {response && (
            <div className="text-[9px]">
              <span className={RESPONSE_STYLE[response] || "text-slate-400"}>
                {response.toUpperCase().replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lesson learned */}
      {lesson && (
        <div className="mt-2 pt-2 border-t border-[#1e1e2e] text-[9px] text-slate-500">
          Lesson: <span className="text-slate-400">{lesson}</span>
        </div>
      )}
    </div>
  );
}

export function DebateArena({ rounds }: Props) {
  if (rounds.length === 0) return null;

  return (
    <div className="border border-cyan-500/30 bg-cyan-500/5 rounded p-4 animate-phaseIn">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">
          AI Cross-Examination Arena
        </h2>
      </div>

      <div className="space-y-4">
        {rounds.map((round, idx) => (
          <DebateRound
            key={idx}
            round={round}
            isLatest={idx === rounds.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
