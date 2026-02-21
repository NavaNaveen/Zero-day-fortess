"use client";

import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import type { BattleSession } from "@/types/battle";
import { transformToGraph, type GraphNode, type GraphLink } from "./graphTransform";
import dynamic from "next/dynamic";
import { Network } from "lucide-react";

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface Props {
  session: BattleSession;
}

const NODE_COLORS: Record<string, string> = {
  safe: "#22c55e",       // green
  risky: "#eab308",      // yellow
  vulnerable: "#ef4444",  // red
  patched: "#3b82f6",    // blue
};

const NODE_GLOW: Record<string, string> = {
  safe: "rgba(34,197,94,0.3)",
  risky: "rgba(234,179,8,0.3)",
  vulnerable: "rgba(239,68,68,0.5)",
  patched: "rgba(59,130,246,0.4)",
};

type NodeShape = "circle" | "hexagon" | "diamond" | "square" | "triangle";

const TYPE_SHAPE: Record<string, NodeShape> = {
  endpoint: "circle",
  file: "hexagon",
  secret: "diamond",
  input: "square",
  external: "triangle",
  attacker: "circle",
};

function drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, shape: NodeShape) {
  ctx.beginPath();
  switch (shape) {
    case "hexagon":
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    case "diamond":
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      break;
    case "square":
      ctx.rect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
      break;
    case "triangle":
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y + r * 0.7);
      ctx.lineTo(x - r, y + r * 0.7);
      ctx.closePath();
      break;
    default: // circle
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      break;
  }
}

export function AttackGraph({ session }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const [pulsePhase, setPulsePhase] = useState(0);

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.max(400, width), height: 350 });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const graphData = useMemo(() => {
    if (!session.attack_surface || Object.keys(session.attack_surface).length === 0) {
      return { nodes: [], links: [] };
    }
    return transformToGraph(session.attack_surface, session.vulnerabilities, session.patches);
  }, [session.attack_surface, session.vulnerabilities, session.patches]);

  const nodeCanvasObject = useCallback(
    (node: GraphNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = node.type === "attacker" ? 10 : node.val * 1.2;
      const color = NODE_COLORS[node.risk] || NODE_COLORS.safe;
      const glow = NODE_GLOW[node.risk] || NODE_GLOW.safe;
      const shape = TYPE_SHAPE[node.type] || "circle";

      // Glow effect
      const pulse = node.risk === "vulnerable" ? 1 + 0.3 * Math.sin(pulsePhase * 0.1) : 1;
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12 * pulse;
      ctx.fillStyle = color;
      drawShape(ctx, x, y, r * pulse, shape);
      ctx.fill();
      ctx.restore();

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      drawShape(ctx, x, y, r * pulse, shape);
      ctx.stroke();

      // Shield icon for patched nodes
      if (node.risk === "patched") {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${r}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🛡", x, y);
      }

      // Label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "3px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const label = node.label.length > 20 ? node.label.slice(0, 20) + "…" : node.label;
      ctx.fillText(label, x, y + r + 3);
    },
    [pulsePhase],
  );

  const linkColor = useCallback((link: GraphLink) => {
    if (link.type === "attack") return "rgba(239,68,68,0.6)";
    if (link.type === "chain") return "rgba(168,85,247,0.8)";
    return "rgba(100,116,139,0.2)";
  }, []);

  const linkWidth = useCallback((link: GraphLink) => {
    return link.type === "chain" ? 2.5 : link.type === "attack" ? 1.5 : 0.5;
  }, []);

  if (graphData.nodes.length === 0) {
    return (
      <div className="border border-[#1e1e2e] rounded p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-red-400" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Attack Surface Graph</span>
        </div>
        <div className="text-slate-600 text-xs text-center py-8">
          Attack surface will map after recon phase...
        </div>
      </div>
    );
  }

  const vulnCount = graphData.nodes.filter((n) => n.risk === "vulnerable").length;
  const patchedCount = graphData.nodes.filter((n) => n.risk === "patched").length;

  return (
    <div className="border border-red-500/20 bg-red-500/5 rounded p-4 animate-phaseIn" ref={containerRef}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-red-400" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Live Attack Surface Graph</span>
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Risky
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Vulnerable ({vulnCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Patched ({patchedCount})
          </span>
        </div>
      </div>

      <div className="rounded overflow-hidden bg-[#060610] border border-[#1e1e2e]">
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width - 32}
          height={dimensions.height}
          backgroundColor="#060610"
          nodeCanvasObject={nodeCanvasObject as (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
          linkColor={linkColor as (link: object) => string}
          linkWidth={linkWidth as (link: object) => number}
          linkDirectionalParticles={(link: object) => (link as GraphLink).type === "attack" ? 3 : 0}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => "#ef4444"}
          nodeRelSize={4}
          d3VelocityDecay={0.4}
          cooldownTicks={100}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>
    </div>
  );
}
