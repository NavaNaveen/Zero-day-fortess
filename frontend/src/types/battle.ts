export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type BattlePhase =
  | "idle"
  | "recon"
  | "assault"
  | "chaining"
  | "patching"
  | "hardening"
  | "reporting"
  | "complete";

export type AgentTeam = "red" | "blue";

export interface Agent {
  codename: string;
  name: string;
  team: AgentTeam;
  status: "idle" | "running" | "done" | "error";
  description: string;
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: Severity;
  title: string;
  description: string;
  file_path: string;
  line_number: number | null;
  endpoint: string;
  payload: string;
  impact: string;
  cvss_score: number;
  cwe_id: string;
  owasp_category: string;
  discovered_by: string;
  discovered_at: string;
  patched: boolean;
  patched_at: string | null;
  verified: boolean;
}

export interface AttackChain {
  id: string;
  title: string;
  steps: string[];
  vulnerability_ids: string[];
  combined_severity: Severity;
  combined_cvss: number;
  outcome: string;
  discovered_by: string;
  discovered_at: string;
}

export interface Patch {
  id: string;
  vulnerability_id: string;
  file_path: string;
  original_code: string;
  patched_code: string;
  diff: string;
  explanation: string;
  generated_by: string;
  generated_at: string;
  verified: boolean;
  pr_url: string;
}

export interface BattleSession {
  id: string;
  state: BattlePhase;
  started_at: string;
  completed_at: string | null;
  vulnerabilities: Vulnerability[];
  chains: AttackChain[];
  patches: Patch[];
  attack_surface: Record<string, unknown>;
  compliance_score: number;
  compliance_delta: number;
  log: string[];
}

export interface WSEvent {
  event: string;
  payload: Record<string, unknown>;
}
