"""
Spider — Recon Agent
Maps the entire attack surface of the target codebase and API.
"""
import json
import os
import re
from pathlib import Path

from core.events import broadcast
from core.llm import ask_llm
from models.vulnerability import BattleSession

SYSTEM = """You are Spider, an elite red-team reconnaissance agent.
Your job is to analyze a codebase and produce a structured attack surface map.

Given file contents and directory structure, identify:
1. All HTTP endpoints (routes, methods, parameters)
2. Input fields that accept user data
3. Authentication & authorization flows
4. Database queries and ORM usage
5. Environment configs and secrets exposure
6. Hidden / internal API routes
7. External service calls (SSRF candidates)
8. File upload/download handlers (path traversal candidates)

Respond ONLY with a JSON object matching this schema:
{
  "endpoints": [{"path": "", "method": "", "params": [], "auth_required": bool, "risk_notes": ""}],
  "input_vectors": [{"location": "", "type": "", "sanitized": bool}],
  "auth_flows": [{"type": "", "implementation": "", "notes": ""}],
  "db_queries": [{"file": "", "line": 0, "query_type": "", "parameterized": bool}],
  "secret_exposures": [{"file": "", "key": "", "severity": ""}],
  "external_calls": [{"file": "", "url_pattern": "", "user_controlled": bool}],
  "file_handlers": [{"file": "", "operation": "", "path_validated": bool}],
  "risk_summary": ""
}"""


def _read_codebase(repo_path: str) -> dict[str, str]:
    """Read all relevant source files from the repo."""
    code_files: dict[str, str] = {}
    extensions = {".js", ".ts", ".py", ".go", ".java", ".php", ".rb", ".env", ".json", ".yaml", ".yml"}
    ignore_dirs = {"node_modules", ".git", "__pycache__", ".next", "dist", "build", "venv", ".venv"}

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_path)
                try:
                    content = Path(full_path).read_text(errors="ignore")
                    if len(content) < 50_000:  # skip huge files
                        code_files[rel_path] = content
                except OSError:
                    pass
    return code_files


async def run(session: BattleSession) -> dict:
    """Run the Spider recon agent and return the attack surface map."""
    await broadcast("agent_status", {"agent": "Spider", "status": "running", "phase": "recon"})
    session.log.append("[Spider] Starting reconnaissance...")

    from core.config import get_settings
    repo_path = session.target_repo_path or get_settings().target_repo_path

    code_files = _read_codebase(repo_path)
    session.log.append(f"[Spider] Scanned {len(code_files)} files")

    # Build a truncated context for LLM (stay within token budget)
    context_parts = []
    total_chars = 0
    for path, content in code_files.items():
        snippet = f"=== {path} ===\n{content[:3000]}\n"
        if total_chars + len(snippet) > 80_000:
            break
        context_parts.append(snippet)
        total_chars += len(snippet)

    prompt = f"""Analyze this codebase and produce the attack surface map.

Directory: {repo_path}
Files analyzed: {len(code_files)}

--- CODE ---
{"".join(context_parts)}
--- END CODE ---

Return ONLY valid JSON."""

    raw = await ask_llm(SYSTEM, prompt, max_tokens=4096, agent_name="Spider")

    # Extract JSON from response
    json_match = re.search(r"\{[\s\S]+\}", raw)
    if json_match:
        attack_surface = json.loads(json_match.group())
    else:
        attack_surface = {"raw": raw, "endpoints": [], "risk_summary": "Parse error"}

    session.attack_surface = attack_surface
    session.log.append(
        f"[Spider] Found {len(attack_surface.get('endpoints', []))} endpoints, "
        f"{len(attack_surface.get('input_vectors', []))} input vectors"
    )

    await broadcast("recon_complete", {"attack_surface": attack_surface, "session_id": session.id})
    return attack_surface
