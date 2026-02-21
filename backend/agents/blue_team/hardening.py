"""
Fortress — Hardening Agent
Applies systemic security defenses beyond individual patches.
"""
import json
import re

from core.events import broadcast
from core.llm import ask_llm
from models.vulnerability import BattleSession

SYSTEM = """You are Fortress, a blue-team hardening specialist.
Given an analysis of vulnerabilities, generate systemic security hardening recommendations.

Focus on:
1. Rate limiting middleware (per endpoint, per IP, per user)
2. Input validation / sanitization middleware (global)
3. Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type)
4. CORS policy tightening
5. Authentication middleware improvements
6. Logging suspicious activity (failed logins, mass requests, unusual patterns)
7. Dependency updates (known CVEs)
8. Database connection hardening (connection limits, query timeouts)
9. Environment secrets management
10. Error handling (no stack traces in production)

Respond ONLY with a JSON object:
{
  "hardening_actions": [
    {
      "category": "rate_limiting|headers|cors|auth|logging|deps|db|secrets|errors",
      "priority": "critical|high|medium|low",
      "title": "",
      "description": "",
      "code_snippet": "implementation example",
      "file_to_modify": ""
    }
  ],
  "security_score_improvement": 0
}"""


async def run(session: BattleSession) -> dict:
    """Run Fortress hardening analysis."""
    await broadcast("agent_status", {"agent": "Fortress", "status": "running", "phase": "hardening"})
    session.log.append("[Fortress] Analyzing systemic hardening opportunities...")

    vuln_summary = [
        {"type": v.type.value, "severity": v.severity.value, "title": v.title}
        for v in session.vulnerabilities
    ]
    attack_surface_summary = {
        "endpoint_count": len(session.attack_surface.get("endpoints", [])),
        "auth_flows": session.attack_surface.get("auth_flows", []),
        "risk_summary": session.attack_surface.get("risk_summary", ""),
    }

    prompt = f"""Vulnerabilities found:
{json.dumps(vuln_summary, indent=2)}

Attack surface overview:
{json.dumps(attack_surface_summary, indent=2)}

Generate systemic hardening recommendations.
Return ONLY valid JSON."""

    raw = await ask_llm(SYSTEM, prompt, max_tokens=3000, agent_name="Fortress")

    json_match = re.search(r"\{[\s\S]+\}", raw)
    if not json_match:
        session.log.append("[Fortress] Could not generate hardening plan")
        return {}

    hardening = json.loads(json_match.group())
    actions = hardening.get("hardening_actions", [])
    session.log.append(f"[Fortress] Generated {len(actions)} hardening actions")

    await broadcast("hardening_complete", {
        "session_id": session.id,
        "hardening": hardening,
    })

    return hardening
