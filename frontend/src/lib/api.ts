import type { BattleSession, ProviderInfo } from "@/types/battle";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function startBattle(
  provider: string = "",
  githubUrl: string = "",
): Promise<{ session_id: string; provider: string }> {
  const params = new URLSearchParams();
  if (provider) params.set("provider", provider);
  if (githubUrl) params.set("github_url", githubUrl);
  const res = await fetch(`${BASE}/battle/start?${params}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start battle");
  return res.json();
}

export async function startBattleRoyale(
  providers: string[],
  githubUrl: string = "",
): Promise<{ status: string; providers: string[] }> {
  const params = new URLSearchParams();
  params.set("providers", providers.join(","));
  if (githubUrl) params.set("github_url", githubUrl);
  const res = await fetch(`${BASE}/battle/royale?${params}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start Battle Royale");
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

export async function getProviderHealth(): Promise<Record<string, ProviderInfo>> {
  const res = await fetch(`${BASE}/health/providers`);
  if (!res.ok) throw new Error("Failed to get provider health");
  return res.json();
}

export async function getBattleRoyale(groupId: string): Promise<{
  group: Record<string, unknown>;
  sessions: Record<string, BattleSession>;
}> {
  const res = await fetch(`${BASE}/battle/royale/${groupId}`);
  if (!res.ok) throw new Error("Battle group not found");
  return res.json();
}
