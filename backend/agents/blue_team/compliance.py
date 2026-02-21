"""
Auditor — Compliance Agent
Translates findings into OWASP, CWE, SOC2, PCI-DSS, GDPR compliance language.
"""
import json
import re
from datetime import datetime

from core.events import broadcast
from core.llm import ask_llm
from models.vulnerability import BattleSession

SYSTEM = """You are Auditor, a security compliance specialist.
Given a list of vulnerabilities and patches, generate a comprehensive compliance report.

Map findings to:
- OWASP Top 10 (2021) categories
- CWE identifiers
- SOC2 Trust Service Criteria
- PCI-DSS requirements
- GDPR articles (if data exposure)

Calculate:
- Compliance score before battle (0-100)
- Compliance score after patches (0-100)
- Risk reduction percentage

Respond ONLY with a JSON object:
{
  "executive_summary": "",
  "compliance_score_before": 0,
  "compliance_score_after": 0,
  "risk_reduction_pct": 0,
  "owasp_findings": [{"category": "A01:2021", "name": "", "count": 0, "patched": 0}],
  "cwe_list": ["CWE-89", "CWE-79"],
  "soc2_impact": [{"criterion": "CC6.1", "description": "", "status": ""}],
  "pci_dss_impact": [{"requirement": "6.2", "description": "", "status": ""}],
  "gdpr_impact": [{"article": "Article 32", "description": "", "risk_level": ""}],
  "critical_findings": 0,
  "high_findings": 0,
  "medium_findings": 0,
  "low_findings": 0,
  "patched_count": 0,
  "verified_count": 0,
  "recommendations": ["Top recommendation 1", "Top recommendation 2"]
}"""


async def run(session: BattleSession) -> dict:
    """Generate compliance report for the battle session."""
    await broadcast("agent_status", {"agent": "Auditor", "status": "running", "phase": "reporting"})
    session.log.append("[Auditor] Generating compliance report...")

    vuln_data = [
        {
            "type": v.type.value,
            "severity": v.severity.value,
            "title": v.title,
            "owasp_category": v.owasp_category,
            "cwe_id": v.cwe_id,
            "patched": v.patched,
            "verified": v.verified,
        }
        for v in session.vulnerabilities
    ]

    chain_data = [
        {"title": c.title, "combined_severity": c.combined_severity.value, "outcome": c.outcome}
        for c in session.chains
    ]

    prompt = f"""Generate compliance report for this security battle:

Vulnerabilities ({len(vuln_data)} total):
{json.dumps(vuln_data, indent=2)[:4000]}

Attack Chains ({len(chain_data)} total):
{json.dumps(chain_data, indent=2)}

Patches Applied: {len(session.patches)}
Verified Fixes: {sum(1 for p in session.patches if p.verified)}

Return ONLY valid JSON compliance report."""

    raw = await ask_llm(SYSTEM, prompt, max_tokens=3000)

    json_match = re.search(r"\{[\s\S]+\}", raw)
    if not json_match:
        session.log.append("[Auditor] Report generation failed")
        return {}

    report = json.loads(json_match.group())

    session.compliance_score = report.get("compliance_score_after", 0)
    session.compliance_delta = (
        report.get("compliance_score_after", 0) - report.get("compliance_score_before", 0)
    )

    session.log.append(
        f"[Auditor] Compliance score: {report.get('compliance_score_before')} → "
        f"{report.get('compliance_score_after')} (+{session.compliance_delta}pts)"
    )

    await broadcast("report_ready", {
        "session_id": session.id,
        "report": report,
        "generated_at": datetime.utcnow().isoformat(),
    })

    return report
