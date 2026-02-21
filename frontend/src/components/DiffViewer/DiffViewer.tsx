"use client";

import { clsx } from "clsx";

interface Props {
  diff: string;
  filePath: string;
  explanation?: string;
}

export function DiffViewer({ diff, filePath, explanation }: Props) {
  const lines = diff.split("\n");

  return (
    <div className="mt-2 border border-[#1e1e2e] rounded overflow-hidden">
      {/* File header */}
      <div className="bg-[#161622] px-3 py-1.5 border-b border-[#1e1e2e] flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-mono">{filePath}</span>
      </div>

      {/* Diff body */}
      <div className="overflow-x-auto text-[11px] leading-[18px] font-mono">
        {lines.map((line, i) => {
          const isAdd = line.startsWith("+") && !line.startsWith("+++");
          const isRemove = line.startsWith("-") && !line.startsWith("---");
          const isHunk = line.startsWith("@@");
          const isMeta = line.startsWith("---") || line.startsWith("+++");

          if (isMeta) return null;

          return (
            <div
              key={i}
              className={clsx(
                "px-3 whitespace-pre",
                isAdd && "bg-green-500/10 text-green-300",
                isRemove && "bg-red-500/10 text-red-300 line-through opacity-70",
                isHunk && "bg-blue-500/5 text-blue-400 text-[10px] py-0.5",
                !isAdd && !isRemove && !isHunk && "text-slate-500"
              )}
            >
              {line}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="bg-[#161622] px-3 py-2 border-t border-[#1e1e2e] text-[10px] text-slate-400">
          <span className="text-blue-400 font-bold">Shield: </span>{explanation}
        </div>
      )}
    </div>
  );
}
