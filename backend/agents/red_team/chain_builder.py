"""
Venom — Chain Builder Agent
Chains low-severity findings into critical multi-step attack paths.
"""
import json
import re

from core.events import broadcast
from core.llm import ask_llm
from models.vulnerability import AttackChain, BattleSession, Severity

SYSTEM = """You are Venom, an elite red-team attack chain analyst.
Given a list of individual vulnerabilities, identify how they can be chained
into multi-step attack sequences that are far more dangerous than each alone.

Think like an advanced attacker:
- Info leaks can enable IDOR exploitation
- IDOR can lead to account takeover
- Auth bypass + IDOR = full admin access
- XSS + CSRF = stored credential theft
- SSRF + cloud metadata = full infrastructure compromise

Respond ONLY with a JSON array:
[{
  "title": "Attack chain name",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "vulnerability_ids": ["vuln-id-1", "vuln-id-2"],
  "combined_severity": "critical|high|medium|low",
  "combined_cvss": 9.0,
  "outcome": "What attacker achieves at end of chain"
}]

Return empty array [] if no meaningful chains exist."""


async def run(session: BattleSession) -> list[AttackChain]:
    """Run Venom chain builder. Returns discovered attack chains."""
    await broadcast("agent_status", {"agent": "Venom", "status": "running", "phase": "chaining"})
    session.log.append("[Venom] Analyzing vulnerability chains...")

    if len(session.vulnerabilities) < 2:
        session.log.append("[Venom] Insufficient vulnerabilities for chaining")
        return []

    vuln_summary = [
        {
            "id": v.id,
            "type": v.type.value,
            "severity": v.severity.value,
            "title": v.title,
            "endpoint": v.endpoint,
            "impact": v.impact,
        }
        for v in session.vulnerabilities
    ]

    prompt = f"""Analyze these vulnerabilities and find attack chains:

{json.dumps(vuln_summary, indent=2)}

Return ONLY valid JSON array of attack chains."""

    raw = await ask_llm(SYSTEM, prompt, max_tokens=2048)

    json_match = re.search(r"\[[\s\S]*\]", raw)
    if not json_match:
        session.log.append("[Venom] No chains identified")
        return []

    chain_data = json.loads(json_match.group())
    chains: list[AttackChain] = []

    severity_map = {
        "critical": Severity.CRITICAL,
        "high": Severity.HIGH,
        "medium": Severity.MEDIUM,
        "low": Severity.LOW,
    }

    for item in chain_data:
        chain = AttackChain(
            title=item.get("title", "Unnamed chain"),
            steps=item.get("steps", []),
            vulnerability_ids=item.get("vulnerability_ids", []),
            combined_severity=severity_map.get(item.get("combined_severity", "high"), Severity.HIGH),
            combined_cvss=float(item.get("combined_cvss", 7.0)),
            outcome=item.get("outcome", ""),
            discovered_by="Venom",
        )
        chains.append(chain)
        session.chains.append(chain)

        await broadcast("chain_discovered", {
            "session_id": session.id,
            "chain": chain.model_dump(mode="json"),
        })
        session.log.append(f"[Venom] Chain: {chain.title} ({chain.combined_severity.value.upper()}) → {chain.outcome}")

    return chains
