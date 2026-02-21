"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { BattleSession, WSEvent, ExamRound, LLMProvider } from "@/types/battle";
import { startBattleRoyale, getSession } from "@/lib/api";
import { playSound, initMute } from "@/utils/audio";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useBattleRoyale() {
  const [sessions, setSessions] = useState<Record<string, BattleSession>>({});
  const [providers, setProviders] = useState<string[]>([]);
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [examRounds, setExamRounds] = useState<ExamRound[]>([]);
  const [examActive, setExamActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionMapRef = useRef<Record<string, string>>({}); // session_id -> provider

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_URL}/battle/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWS, 2000);
    };

    ws.onmessage = (e) => {
      const msg: WSEvent = JSON.parse(e.data);
      setEvents((prev) => [...prev.slice(-500), msg]);

      playSound(msg.event);

      // Route session events to the correct provider
      const sessionId = msg.payload?.session_id as string | undefined;
      if (sessionId && sessionMapRef.current[sessionId]) {
        getSession(sessionId).then((s) => {
          const provider = sessionMapRef.current[sessionId];
          setSessions((prev) => ({ ...prev, [provider]: s }));
        }).catch(() => null);
      }

      // Handle cross-examination events
      if (msg.event === "cross_exam_started") {
        setExamActive(true);
        playSound("battle_royale_started");
      }

      if (msg.event === "cross_exam_exchange") {
        const round = msg.payload as unknown as ExamRound;
        if (round) {
          setExamRounds((prev) => [...prev, round]);
          playSound("cross_exam_exchange");
        }
      }

      if (msg.event === "cross_exam_complete") {
        setExamActive(false);
      }

      // Handle battle royale complete
      if (msg.event === "battle_royale_complete") {
        playSound("battle_complete");
      }
    };
  }, []);

  useEffect(() => {
    initMute();
    connectWS();
    return () => wsRef.current?.close();
  }, [connectWS]);

  const launchRoyale = useCallback(async (selectedProviders: LLMProvider[], githubUrl: string = "") => {
    setIsStarting(true);
    setExamRounds([]);
    setExamActive(false);
    setSessions({});
    setProviders(selectedProviders);
    sessionMapRef.current = {};
    playSound("battle_start");

    try {
      await startBattleRoyale(selectedProviders, githubUrl);

      // Poll for sessions to get their IDs (the royale endpoint doesn't return them immediately)
      // Instead, we'll pick them up from WS events via session_id -> provider mapping
      // The backend broadcasts events with session_id and provider info
    } finally {
      setIsStarting(false);
    }
  }, []);

  // Track session_id -> provider mapping from WS events
  useEffect(() => {
    const latestEvents = events.slice(-50);
    for (const evt of latestEvents) {
      const sessionId = evt.payload?.session_id as string | undefined;
      const provider = evt.payload?.provider as string | undefined;
      if (sessionId && provider && !sessionMapRef.current[sessionId]) {
        sessionMapRef.current[sessionId] = provider;
        // Immediately fetch the session
        getSession(sessionId).then((s) => {
          setSessions((prev) => ({ ...prev, [provider]: s }));
          // Ensure provider is in list
          setProviders((prev) => prev.includes(provider) ? prev : [...prev, provider]);
        }).catch(() => null);
      }
    }
  }, [events]);

  const allComplete = providers.length > 0 && providers.every(
    (p) => sessions[p]?.state === "complete"
  );

  return {
    sessions,
    providers,
    events,
    connected,
    isStarting,
    examRounds,
    examActive,
    allComplete,
    launchRoyale,
  };
}
