"use client";

import { useState, useEffect } from "react";

const BOOT_LINES = [
  { text: "> Initializing neural mesh network...", delay: 0 },
  { text: "> Loading adversarial attack vectors...", delay: 300 },
  { text: "> Deploying RED TEAM agents [Spider, Blade, Phantom, Venom]", delay: 600 },
  { text: "> Deploying BLUE TEAM agents [Shield, Proof, Fortress, Auditor]", delay: 900 },
  { text: "> Loading multi-LLM inference engines [Ollama, Claude, GPT, Gemini]", delay: 1200 },
  { text: "> Battle Royale cross-examination arena ARMED", delay: 1500 },
  { text: "> War General orchestrator ONLINE", delay: 1800 },
  { text: "> System ready. All providers standing by.", delay: 2100 },
  { text: "", delay: 2400 },
];

export function BootSequence() {
  const [visible, setVisible] = useState(true);
  const [visibleLines, setVisibleLines] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show once per tab session
    if (typeof window !== "undefined" && sessionStorage.getItem("zdf-booted")) {
      setVisible(false);
      return;
    }

    // Reveal lines one by one
    const timers: NodeJS.Timeout[] = [];
    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });

    // Start fade out
    timers.push(setTimeout(() => setFadeOut(true), 2800));

    // Remove boot screen
    timers.push(setTimeout(() => {
      setVisible(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("zdf-booted", "true");
      }
    }, 3300));

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="max-w-lg w-full px-8">
        {/* ASCII Logo */}
        <pre className="text-green-500 text-[10px] leading-tight mb-6 font-mono text-center">
{`╔══════════════════════════════════════╗
║     ███████╗███████╗██████╗ ███████╗ ║
║     ╚══███╔╝██╔════╝██╔══██╗██╔════╝ ║
║       ███╔╝ █████╗  ██████╔╝█████╗   ║
║      ███╔╝  ██╔══╝  ██╔══██╗██╔══╝   ║
║     ███████╗███████╗██║  ██║██║       ║
║     ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝       ║
║          DAY FORTRESS v1.0            ║
╚══════════════════════════════════════╝`}
        </pre>

        {/* Boot lines */}
        <div className="space-y-1 font-mono text-xs">
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={
                line.text.includes("RED TEAM")
                  ? "text-red-400"
                  : line.text.includes("BLUE TEAM")
                  ? "text-blue-400"
                  : line.text.includes("ONLINE") || line.text.includes("ready")
                  ? "text-green-400 font-bold"
                  : "text-green-500/70"
              }
            >
              {line.text}
              {i === visibleLines - 1 && line.text && (
                <span className="inline-block w-2 h-3.5 bg-green-500 ml-1 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-0.5 bg-green-500/20 animate-phaseScan" />
      </div>
    </div>
  );
}
