"use client";

import type { Patch, Vulnerability } from "@/types/battle";
import { X, FileCode2, ShieldCheck, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  patch: Patch;
  vuln?: Vulnerability;
  onClose: () => void;
}

export function PatchViewer({ patch, vuln, onClose }: Props) {
  const diffLines = patch.diff.split("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Patch Viewer</span>
            {patch.verified ? (
              <span className="flex items-center gap-1 text-[10px] text-green-400 border border-green-400/30 bg-green-400/10 px-1.5 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 rounded">
                <ShieldAlert className="w-3 h-3" /> UNVERIFIED
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Meta */}
          {vuln && (
            <div className="border border-[#1e1e2e] rounded p-3 text-xs space-y-1">
              <div className="text-slate-400">
                <span className="text-slate-500">Vulnerability: </span>
                <span className="text-white font-bold">{vuln.title}</span>
              </div>
              <div className="text-slate-400">
                <span className="text-slate-500">File: </span>
                <span className="text-blue-400">{patch.file_path || vuln.file_path || "unknown"}</span>
              </div>
              <div className="text-slate-400">
                <span className="text-slate-500">Type: </span>
                <span className="text-red-400">{vuln.type}</span>
                {vuln.cwe_id && <span className="text-slate-500 ml-2">{vuln.cwe_id}</span>}
              </div>
            </div>
          )}

          {/* Explanation */}
          {patch.explanation && (
            <div className="border border-blue-500/20 bg-blue-500/5 rounded p-3 text-xs text-blue-300">
              <div className="text-[10px] text-blue-500 mb-1 uppercase tracking-widest">Explanation</div>
              {patch.explanation}
            </div>
          )}

          {/* Diff */}
          {patch.diff ? (
            <div>
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">Unified Diff</div>
              <div className="border border-[#1e1e2e] rounded overflow-hidden text-[11px] leading-5">
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "px-3 whitespace-pre-wrap break-all",
                      line.startsWith("+") && !line.startsWith("+++") && "bg-green-900/30 text-green-300",
                      line.startsWith("-") && !line.startsWith("---") && "bg-red-900/30 text-red-300",
                      line.startsWith("@@") && "bg-blue-900/20 text-blue-400",
                      line.startsWith("---") || line.startsWith("+++") ? "text-slate-500" : "",
                      !line.startsWith("+") && !line.startsWith("-") && !line.startsWith("@@") && !line.startsWith("---") && !line.startsWith("+++") && "text-slate-400"
                    )}
                  >
                    {line || " "}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Fallback: show original vs patched side by side */
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-red-500 mb-1 uppercase tracking-widest">Before (Vulnerable)</div>
                <pre className="border border-red-500/20 bg-red-500/5 rounded p-3 text-[11px] text-red-300 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                  {patch.original_code || "— not available —"}
                </pre>
              </div>
              <div>
                <div className="text-[10px] text-green-500 mb-1 uppercase tracking-widest">After (Patched)</div>
                <pre className="border border-green-500/20 bg-green-500/5 rounded p-3 text-[11px] text-green-300 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                  {patch.patched_code || "— not available —"}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
