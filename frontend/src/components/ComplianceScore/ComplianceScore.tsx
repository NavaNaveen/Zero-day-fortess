"use client";

import { RadialBarChart, RadialBar, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { clsx } from "clsx";

interface Props {
  score: number;
  delta: number;
  report?: Record<string, unknown>;
}

export function ComplianceScore({ score, delta, report }: Props) {
  const color = score >= 80 ? "#00ff88" : score >= 60 ? "#ffaa00" : "#ff3366";

  const data = [{ name: "score", value: score, fill: color }];

  // Build radar data from compliance report
  const radarData = [];
  if (report && Object.keys(report).length > 0) {
    const owasp = (report.owasp_findings as Array<{ count: number; patched: number }>) ?? [];
    const owaspTotal = owasp.reduce((s, f) => s + (f.count || 0), 0);
    const owaspPatched = owasp.reduce((s, f) => s + (f.patched || 0), 0);
    const owaspScore = owaspTotal > 0 ? Math.round((owaspPatched / owaspTotal) * 100) : 50;
    const soc2 = (report.soc2_impact as Array<Record<string, unknown>>) ?? [];
    const pci = (report.pci_dss_impact as Array<Record<string, unknown>>) ?? [];
    const gdpr = (report.gdpr_impact as Array<Record<string, unknown>>) ?? [];

    radarData.push(
      { framework: "OWASP", value: Math.min(owaspScore, 100) },
      { framework: "SOC2", value: Math.min(soc2.length > 0 ? 70 : 40, 100) },
      { framework: "PCI-DSS", value: Math.min(pci.length > 0 ? 65 : 35, 100) },
      { framework: "GDPR", value: Math.min(gdpr.length > 0 ? 75 : 45, 100) },
      { framework: "CWE", value: Math.min(score, 100) },
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={8}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#1e1e2e" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] text-slate-500">/ 100</span>
        </div>
      </div>

      {delta !== 0 && (
        <div className={clsx("text-xs font-mono mt-1", delta > 0 ? "text-green-400" : "text-red-400")}>
          {delta > 0 ? "+" : ""}
          {delta} pts
        </div>
      )}

      <div className="text-[10px] text-slate-500 mt-1">Compliance Score</div>

      {/* Radar chart for framework breakdown */}
      {radarData.length > 0 && (
        <div className="w-full h-36 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1e1e2e" />
              <PolarAngleAxis
                dataKey="framework"
                tick={{ fill: "#94a3b8", fontSize: 9 }}
              />
              <Radar
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
