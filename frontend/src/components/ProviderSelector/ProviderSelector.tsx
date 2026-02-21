"use client";

import { useState, useEffect } from "react";
import { getProviderHealth } from "@/lib/api";
import type { LLMProvider, ProviderInfo } from "@/types/battle";
import { clsx } from "clsx";

const PROVIDERS: { id: LLMProvider; label: string; color: string }[] = [
  { id: "ollama", label: "Ollama", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "anthropic", label: "Claude", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  { id: "openai", label: "GPT", color: "text-green-400 border-green-500/30 bg-green-500/10" },
  { id: "gemini", label: "Gemini", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
];

interface Props {
  selected: LLMProvider[];
  onChange: (providers: LLMProvider[]) => void;
  multi?: boolean;
}

export function ProviderSelector({ selected, onChange, multi = false }: Props) {
  const [health, setHealth] = useState<Record<string, ProviderInfo>>({});

  useEffect(() => {
    getProviderHealth().then(setHealth).catch(() => {});
    const interval = setInterval(() => {
      getProviderHealth().then(setHealth).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggle = (id: LLMProvider) => {
    if (multi) {
      if (selected.includes(id)) {
        onChange(selected.filter((p) => p !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      onChange([id]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest mr-1">
        {multi ? "Providers" : "Provider"}
      </span>
      {PROVIDERS.map((p) => {
        const available = health[p.id]?.available ?? false;
        const isSelected = selected.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={clsx(
              "px-2 py-1 rounded border text-[10px] font-bold transition-all",
              isSelected ? p.color : "border-slate-700 text-slate-600 bg-transparent",
              !available && "opacity-30 cursor-not-allowed",
            )}
            disabled={!available}
            title={available ? `${p.label}: ${health[p.id]?.model}` : `${p.label}: unavailable`}
          >
            <span className="flex items-center gap-1">
              {available && (
                <span className={clsx("w-1.5 h-1.5 rounded-full", isSelected ? "bg-current" : "bg-slate-600")} />
              )}
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const PROVIDER_COLORS: Record<string, string> = {
  ollama: "text-purple-400",
  anthropic: "text-orange-400",
  openai: "text-green-400",
  gemini: "text-blue-400",
};

export const PROVIDER_BG: Record<string, string> = {
  ollama: "border-purple-500/30 bg-purple-500/5",
  anthropic: "border-orange-500/30 bg-orange-500/5",
  openai: "border-green-500/30 bg-green-500/5",
  gemini: "border-blue-500/30 bg-blue-500/5",
};
