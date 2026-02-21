"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { BattleSession, WSEvent, Vulnerability, AttackChain } from "@/types/battle";
import { startBattle, getSession } from "@/lib/api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useBattle() {
  const [session, setSession] = useState<BattleSession | null>(null);
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
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

      // Refresh session data on key events
      if (
        sessionIdRef.current &&
        ["vulnerability_found", "patch_generated", "chain_discovered", "battle_complete", "phase_change"].includes(
          msg.event
        )
      ) {
        getSession(sessionIdRef.current).then(setSession).catch(() => null);
      }
    };
  }, []);

  useEffect(() => {
    connectWS();
    return () => wsRef.current?.close();
  }, [connectWS]);

  const launch = useCallback(async () => {
    setIsStarting(true);
    try {
      const { session_id } = await startBattle();
      sessionIdRef.current = session_id;
      const s = await getSession(session_id);
      setSession(s);
    } finally {
      setIsStarting(false);
    }
  }, []);

  return { session, events, connected, isStarting, launch };
}
