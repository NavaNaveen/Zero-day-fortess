"use client";

import type { ComplianceReport as CR } from "@/types/battle";
import { X, ShieldCheck, AlertTriangle, FileText } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  report: Partial<CR>;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  onClose: () => void;
}

const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("pass") || s.includes("comply") || s.includes("mitigated")) return "text-green-400";
  if (s.includes("partial")) return "text-amber-400";
  return "text-red-400";
};

export function ComplianceReport({ report, scoreBefore, scoreAfter, delta, onClose }: Props) {
  const color = scoreAfter >= 80 ? "text-green-400" : scoreAfter >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Compliance Report</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Score summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-[#1e1e2e] rounded p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{scoreBefore}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Score Before</div>
            </div>
            <div className="border border-[#1e1e2e] rounded p-3 text-center">
              <div className={clsx("text-2xl font-bold", color)}>{scoreAfter}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Score After</div>
            </div>
            <div className="border border-green-500/20 bg-green-500/5 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-400">+{delta}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Improvement</div>
            </div>
          </div>

          {/* Executive Summary */}
          {report.executive_summary && (
            <div className="border border-blue-500/20 bg-blue-500/5 rounded p-3 text-xs text-blue-300">
              <div className="text-[10px] text-blue-500 mb-1 uppercase tracking-widest">Executive Summary</div>
              {report.executive_summary}
            </div>
          )}

          {/* Findings count */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Critical", val: report.critical_findings ?? 0, cls: "text-red-400" },
              { label: "High", val: report.high_findings ?? 0, cls: "text-orange-400" },
              { label: "Medium", val: report.medium_findings ?? 0, cls: "text-amber-400" },
              { label: "Low", val: report.low_findings ?? 0, cls: "text-blue-400" },
            ].map((f) => (
              <div key={f.label} className="border border-[#1e1e2e] rounded p-2 text-center">
                <div className={clsx("text-xl font-bold", f.cls)}>{f.val}</div>
                <div className="text-[10px] text-slate-500">{f.label}</div>
              </div>
            ))}
          </div>

          {/* OWASP Findings */}
          {report.owasp_findings && report.owasp_findings.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">OWASP Top 10 Findings</div>
              <div className="border border-[#1e1e2e] rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1a1a2e] text-slate-500 text-[10px] uppercase">
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-center">Found</th>
                      <th className="px-3 py-2 text-center">Patched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.owasp_findings.map((f, i) => (
                      <tr key={i} className={clsx("border-t border-[#1e1e2e]", i % 2 === 0 ? "bg-transparent" : "bg-[#0f0f1a]")}>
                        <td className="px-3 py-2 text-red-400 font-bold">{f.category}</td>
                        <td className="px-3 py-2 text-slate-300">{f.name}</td>
                        <td className="px-3 py-2 text-center text-red-400">{f.count}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={f.patched >= f.count ? "text-green-400" : "text-amber-400"}>
                            {f.patched}/{f.count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CWE List */}
          {report.cwe_list && report.cwe_list.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">CWE Identifiers</div>
              <div className="flex flex-wrap gap-2">
                {report.cwe_list.map((cwe, i) => (
                  <span key={i} className="text-[10px] border border-slate-600 text-slate-400 px-2 py-0.5 rounded">
                    {cwe}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOC2 */}
          {report.soc2_impact && report.soc2_impact.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">SOC 2 Impact</div>
              <div className="space-y-1">
                {report.soc2_impact.map((s, i) => (
                  <div key={i} className="border border-[#1e1e2e] rounded px-3 py-2 flex items-start gap-2 text-xs">
                    <span className="text-purple-400 font-bold flex-shrink-0">{s.criterion}</span>
                    <span className="text-slate-400 flex-1">{s.description}</span>
                    <span className={clsx("flex-shrink-0 text-[10px]", statusColor(s.status))}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PCI-DSS */}
          {report.pci_dss_impact && report.pci_dss_impact.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">PCI-DSS Requirements</div>
              <div className="space-y-1">
                {report.pci_dss_impact.map((p, i) => (
                  <div key={i} className="border border-[#1e1e2e] rounded px-3 py-2 flex items-start gap-2 text-xs">
                    <span className="text-amber-400 font-bold flex-shrink-0">Req {p.requirement}</span>
                    <span className="text-slate-400 flex-1">{p.description}</span>
                    <span className={clsx("flex-shrink-0 text-[10px]", statusColor(p.status))}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">Recommendations</div>
              <div className="space-y-1">
                {report.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-green-400 flex-shrink-0 mt-0.5">▸</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
