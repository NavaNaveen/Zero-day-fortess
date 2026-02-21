"""
Proof — Verification Agent
Re-runs exploits to verify patches actually work.
"""
import httpx

from core.config import get_settings
from core.events import broadcast
from core.llm import ask_llm
from models.vulnerability import BattleSession, Patch, Vulnerability

SYSTEM = """You are Proof, a blue-team verification specialist.
Given a vulnerability, its exploit payload, and an applied patch,
determine if the patch is effective.

Analyze:
1. Does the patched code address the root cause?
2. Does the fix correctly handle the original payload?
3. Are there bypass variants that still work?
4. Does the fix break any functionality?

Respond ONLY with a JSON object:
{
  "verified": true|false,
  "confidence": 0.0-1.0,
  "reason": "explanation",
  "bypass_found": false,
  "bypass_payload": "",
  "functionality_preserved": true
}"""


async def _probe(base_url: str, endpoint: str, payload: str) -> tuple[int, str]:
    """Send exploit probe, return (status_code, response_excerpt)."""
    url = base_url.rstrip("/") + "/" + endpoint.lstrip("/")
    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            resp = await client.get(url, params={"q": payload, "id": payload})
            return resp.status_code, resp.text[:500]
    except Exception as e:
        return 0, str(e)[:100]


async def run(session: BattleSession, vuln: Vulnerability, patch: Patch) -> bool:
    """Verify that the patch fixed the vulnerability. Returns True if verified."""
    await broadcast("agent_status", {
        "agent": "Proof", "status": "verifying",
        "vulnerability": vuln.title, "session_id": session.id,
    })
    session.log.append(f"[Proof] Verifying patch for: {vuln.title}")

    settings = get_settings()

    # Attempt live probe
    probe_result = ""
    if vuln.endpoint and vuln.payload:
        base_url = session.target_base_url or settings.target_base_url
        status, body = await _probe(base_url, vuln.endpoint, vuln.payload)
        probe_result = f"HTTP {status}: {body}"

    prompt = f"""Verify this patch:

Vulnerability:
  Type: {vuln.type.value}
  Payload: {vuln.payload}
  Endpoint: {vuln.endpoint}

Patch applied:
  Original: {patch.original_code[:500]}
  Fixed: {patch.patched_code[:500]}
  Explanation: {patch.explanation}

Live probe result (after patch): {probe_result or "Not available (offline)"}

Is the vulnerability fixed? Return ONLY valid JSON."""

    import json
    import re
    raw = await ask_llm(SYSTEM, prompt, max_tokens=512, agent_name="Proof")
    json_match = re.search(r"\{[\s\S]+\}", raw)

    verified = False
    if json_match:
        result = json.loads(json_match.group())
        verified = result.get("verified", False)
        confidence = result.get("confidence", 0.0)
        reason = result.get("reason", "")
        session.log.append(
            f"[Proof] {'✅ VERIFIED' if verified else '❌ FAILED'} "
            f"({confidence:.0%} confidence): {reason}"
        )
    else:
        session.log.append("[Proof] Could not parse verification result")

    vuln.verified = verified
    patch.verified = verified

    await broadcast("verification_result", {
        "session_id": session.id,
        "vulnerability_id": vuln.id,
        "patch_id": patch.id,
        "verified": verified,
    })

    return verified
