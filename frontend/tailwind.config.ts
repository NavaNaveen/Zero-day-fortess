import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fortress: {
          bg: "#0a0a0f",
          surface: "#111118",
          border: "#1e1e2e",
          red: "#ff3366",
          "red-dim": "#ff336620",
          blue: "#00d4ff",
          "blue-dim": "#00d4ff20",
          green: "#00ff88",
          "green-dim": "#00ff8820",
          amber: "#ffaa00",
          "amber-dim": "#ffaa0020",
          text: "#e0e0f0",
          "text-muted": "#6e6e8a",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan": "scan 3s linear infinite",
        "glow-red": "glowRed 2s ease-in-out infinite alternate",
        "glow-blue": "glowBlue 2s ease-in-out infinite alternate",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glowRed: {
          from: { boxShadow: "0 0 5px #ff3366, 0 0 10px #ff3366" },
          to: { boxShadow: "0 0 10px #ff3366, 0 0 30px #ff3366, 0 0 60px #ff336640" },
        },
        glowBlue: {
          from: { boxShadow: "0 0 5px #00d4ff, 0 0 10px #00d4ff" },
          to: { boxShadow: "0 0 10px #00d4ff, 0 0 30px #00d4ff, 0 0 60px #00d4ff40" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
