"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { BattleSession, BattlePhase, WSEvent, Vulnerability, AttackChain } from "@/types/battle";
import type { AgentThought } from "@/components/AgentTerminal/AgentTerminal";
import { startBattle, getSession } from "@/lib/api";
import { playSound, initMute } from "@/utils/audio";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useBattle() {
  const [session, setSession] = useState<BattleSession | null>(null);
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [phaseTransition, setPhaseTransition] = useState<BattlePhase | null>(null);
  const [agentThoughts, setAgentThoughts] = useState<AgentThought[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_URL}/battle/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 2s
      setTimeout(connectWS, 2000);
    };

    ws.onmessage = (e) => {
      const msg: WSEvent = JSON.parse(e.data);
      setEvents((prev) => [...prev.slice(-200), msg]);

      // Play sound effects for key events
      playSound(msg.event);

      // Handle phase transitions
      if (msg.event === "phase_change" && msg.payload?.phase) {
        setPhaseTransition(msg.payload.phase as BattlePhase);
      }

      // Handle agent thinking events
      if (msg.event === "agent_thinking" && msg.payload?.agent) {
        setAgentThoughts((prev) => [
          ...prev.slice(-100),
          {
            agent: msg.payload.agent as string,
            status: msg.payload.status as "thinking" | "done",
            prompt_preview: msg.payload.prompt_preview as string | undefined,
            response_preview: msg.payload.response_preview as string | undefined,
            timestamp: Date.now(),
          },
        ]);
      }

      // Refresh session data on key events
      if (
        sessionIdRef.current &&
        ["vulnerability_found", "patch_generated", "chain_discovered", "battle_complete", "phase_change", "pr_created", "hardening_complete"].includes(
          msg.event
        )
      ) {
        getSession(sessionIdRef.current).then(setSession).catch(() => null);
      }
    };
  }, []);

  useEffect(() => {
    initMute();
    connectWS();
    return () => wsRef.current?.close();
  }, [connectWS]);

  const launch = useCallback(async (provider: string = "", githubUrl: string = "") => {
    setIsStarting(true);
    setAgentThoughts([]);
    playSound("battle_start");
    try {
      const { session_id } = await startBattle(provider, githubUrl);
      sessionIdRef.current = session_id;
      const s = await getSession(session_id);
      setSession(s);
    } finally {
      setIsStarting(false);
    }
  }, []);

  return { session, events, connected, isStarting, phaseTransition, agentThoughts, launch };
}
