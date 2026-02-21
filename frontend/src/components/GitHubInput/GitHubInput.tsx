"use client";

import { useState } from "react";
import { Github, Search, X } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  onSubmit: (url: string) => void;
}

export function GitHubInput({ onSubmit }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validate = (input: string): boolean => {
    if (!input) return true;
    const pattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/;
    return pattern.test(input);
  };

  const handleSubmit = () => {
    if (!url) return;
    if (!validate(url)) {
      setError("Invalid GitHub URL (e.g. https://github.com/owner/repo)");
      return;
    }
    setError("");
    onSubmit(url);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Github className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="https://github.com/owner/repo"
          className={clsx(
            "w-full pl-7 pr-7 py-1.5 rounded border text-xs bg-[#0a0a0f] font-mono",
            "focus:outline-none focus:ring-1",
            error
              ? "border-red-500/50 focus:ring-red-500/50"
              : "border-[#1e1e2e] focus:ring-blue-500/50 text-slate-300",
          )}
        />
        {url && (
          <button
            onClick={() => { setUrl(""); setError(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {error && <span className="text-red-400 text-[10px]">{error}</span>}
      {url && !error && (
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1 px-2 py-1.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-colors"
        >
          <Search className="w-3 h-3" />
          SCAN
        </button>
      )}
    </div>
  );
}
