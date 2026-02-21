import type { Severity } from "@/types/battle";

export const severityColor: Record<Severity, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  info: "text-slate-400 bg-slate-400/10 border-slate-400/30",
};

export const severityDot: Record<Severity, string> = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-blue-400",
  info: "bg-slate-400",
};

export const cvssColor = (score: number): string => {
  if (score >= 9.0) return "text-red-400";
  if (score >= 7.0) return "text-orange-400";
  if (score >= 4.0) return "text-amber-400";
  return "text-blue-400";
};
