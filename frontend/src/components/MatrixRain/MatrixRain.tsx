"use client";

import { useEffect, useRef } from "react";

// Katakana + hex digits — classic Matrix aesthetic
const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "0123456789ABCDEF$@#%&<>[]{}|/\\";

interface MatrixRainProps {
  height?: number;
  label?: string;
}

export function MatrixRain({ height = 220, label = "SCANNING..." }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 13;
    const W = canvas.parentElement?.clientWidth ?? 400;
    const H = height;
    canvas.width = W;
    canvas.height = H;

    const cols = Math.floor(W / fontSize);

    // Start each column at a random negative offset so they stagger in
    const drops: number[] = Array.from({ length: cols }, () =>
      Math.floor(Math.random() * -(H / fontSize))
    );

    let lastTime = 0;
    let animId: number;

    const draw = (timestamp: number) => {
      animId = requestAnimationFrame(draw);
      if (timestamp - lastTime < 55) return; // ~18 fps — steady rain pace
      lastTime = timestamp;

      // Semi-transparent overlay creates the fading trail
      ctx.fillStyle = "rgba(10, 10, 15, 0.13)";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < cols; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head of the column — bright near-white green
        ctx.fillStyle = "#afffaf";
        ctx.font = `bold ${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
        ctx.fillText(char, x, y);

        // Second character slightly dimmer (gives the "glowing head" look)
        const prevChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = "#00ff41";
        ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
        ctx.fillText(prevChar, x, y - fontSize);

        drops[i]++;

        // Reset column after it falls off screen, with random chance
        if (y > H && Math.random() > 0.975) {
          drops[i] = Math.floor(Math.random() * -30);
        }
      }
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [height]);

  return (
    <div className="relative rounded overflow-hidden" style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Centred label overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-green-400 text-[11px] tracking-[0.3em] font-bold
                         bg-black/50 px-4 py-1.5 rounded border border-green-500/30
                         animate-pulse">
          {label}
        </span>
      </div>
      {/* Subtle top/bottom fade so it blends into the panel */}
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#0a0a0f] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </div>
  );
}
