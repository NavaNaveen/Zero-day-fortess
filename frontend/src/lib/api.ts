import type { BattleSession } from "@/types/battle";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function startBattle(): Promise<{ session_id: string }> {
  const res = await fetch(`${BASE}/battle/start`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start battle");
  return res.json();
}

export async function getSession(sessionId: string): Promise<BattleSession> {
  const res = await fetch(`${BASE}/battle/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function getLatestSession(): Promise<BattleSession> {
  const res = await fetch(`${BASE}/battle/latest`);
  if (!res.ok) throw new Error("No sessions");
  return res.json();
}

export async function listSessions(): Promise<BattleSession[]> {
  const res = await fetch(`${BASE}/battle/sessions`);
  if (!res.ok) throw new Error("Failed to list sessions");
  return res.json();
}
