"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { clsx } from "clsx";

interface Props {
  score: number;
  delta: number;
}

export function ComplianceScore({ score, delta }: Props) {
  const color = score >= 80 ? "#00ff88" : score >= 60 ? "#ffaa00" : "#ff3366";

  const data = [{ name: "score", value: score, fill: color }];

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
    </div>
  );
}
