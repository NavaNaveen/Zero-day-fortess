"""
Phantom — Business Logic Agent
Discovers logic-level vulnerabilities: price manipulation, workflow bypass, race conditions.
"""
import json
import re

from core.events import broadcast
from core.llm import ask_llm
from models.vulnerability import BattleSession, Severity, Vulnerability, VulnType

SYSTEM = """You are Phantom, an elite red-team business logic analyst.
You find vulnerabilities that scanners miss — logic flaws in how the application works.

Look for:
- Price manipulation (negative quantities, integer overflow, discount abuse)
- Coupon/promo code abuse (reuse after expiry, stack unlimited times)
- Workflow bypass (skip payment step, skip verification step)
- Privilege escalation (role parameter tampering, mass assignment)
- Race conditions (double-spend, concurrent registration)
- Insecure direct object references in business flows
- Account enumeration via timing/response differences
- Password reset flow abuse (token reuse, host header injection)

Given code and attack surface, identify business logic flaws.

Respond ONLY with a JSON array:
[{
  "vuln_type": "business_logic",
  "severity": "critical|high|medium|low",
  "title": "",
  "description": "",
  "endpoint": "",
  "payload": "",
  "steps_to_reproduce": ["Step 1", "Step 2"],
  "impact": "",
  "cvss_score": 0.0,
  "file_path": "",
  "line_number": null
}]"""


async def run(session: BattleSession) -> list[Vulnerability]:
    """Run Phantom logic analysis. Returns logic vulnerabilities."""
    await broadcast("agent_status", {"agent": "Phantom", "status": "running", "phase": "assault"})
    session.log.append("[Phantom] Hunting business logic flaws...")

    attack_surface = session.attack_surface

    prompt = f"""Analyze this attack surface for business logic vulnerabilities:

{json.dumps(attack_surface, indent=2)[:5000]}

Focus on workflows, transactions, state transitions, and access control logic.
Return ONLY valid JSON array."""

    raw = await ask_llm(SYSTEM, prompt, max_tokens=3000)

    json_match = re.search(r"\[[\s\S]*\]", raw)
    if not json_match:
        session.log.append("[Phantom] No logic flaws found (parse error)")
        return []

    flaw_data = json.loads(json_match.group())
    vulnerabilities: list[Vulnerability] = []

    severity_map = {
        "critical": Severity.CRITICAL,
        "high": Severity.HIGH,
        "medium": Severity.MEDIUM,
        "low": Severity.LOW,
        "info": Severity.INFO,
    }

    for item in flaw_data:
        vuln = Vulnerability(
            type=VulnType.BUSINESS_LOGIC,
            severity=severity_map.get(item.get("severity", "medium"), Severity.MEDIUM),
            title=item.get("title", "Business Logic Flaw"),
            description=item.get("description", item.get("impact", "")),
            endpoint=item.get("endpoint", ""),
            payload=item.get("payload", ""),
            impact=item.get("impact", ""),
            cvss_score=float(item.get("cvss_score", 5.0)),
            file_path=item.get("file_path", ""),
            line_number=item.get("line_number"),
            discovered_by="Phantom",
        )
        vulnerabilities.append(vuln)
        session.vulnerabilities.append(vuln)

        await broadcast("vulnerability_found", {
            "session_id": session.id,
            "vulnerability": vuln.model_dump(mode="json"),
        })
        session.log.append(f"[Phantom] Logic flaw: {vuln.title}")

    return vulnerabilities
