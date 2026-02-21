"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import { Terminal } from "lucide-react";

interface AgentThought {
  agent: string;
  status: "thinking" | "done";
  prompt_preview?: string;
  response_preview?: string;
  timestamp: number;
}

const RED_AGENTS = new Set(["Spider", "Blade", "Phantom", "Venom"]);

interface Props {
  thoughts: AgentThought[];
}

export type { AgentThought };

export function AgentTerminal({ thoughts }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  if (thoughts.length === 0) {
    return (
      <div className="border border-[#1e1e2e] rounded p-3">
        <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5">
          <Terminal className="w-3 h-3" /> Agent Terminal
        </div>
        <div className="text-slate-700 text-[10px] font-mono">
          <span className="text-green-500">$</span> Awaiting agent activity...
          <span className="inline-block w-1.5 h-3 bg-green-500/70 ml-0.5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#1e1e2e] rounded p-3">
      <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1.5">
        <Terminal className="w-3 h-3" /> Agent Terminal
      </div>
      <div
        ref={scrollRef}
        className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]"
      >
        {thoughts.slice(-50).map((t, i) => {
          const isRed = RED_AGENTS.has(t.agent);
          const agentColor = isRed ? "text-red-400" : "text-blue-400";
          const isThinking = t.status === "thinking";

          return (
            <div key={i} className="leading-tight">
              <span className={clsx("font-bold", agentColor)}>
                [{t.agent}]
              </span>{" "}
              {isThinking ? (
                <span className="text-slate-400">
                  <span className="text-yellow-500/60">analyzing:</span>{" "}
                  {t.prompt_preview}
                  <span className="inline-block w-1.5 h-3 bg-yellow-500/50 ml-0.5 animate-pulse" />
                </span>
              ) : (
                <span className="text-green-300/80">
                  {t.response_preview}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
