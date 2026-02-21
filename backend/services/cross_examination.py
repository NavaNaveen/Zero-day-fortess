"""
Cross-Examination Arena — LLMs challenge each other's vulnerability findings.
The ultimate hackathon feature: AIs debating cybersecurity in real-time.
"""
import json
import re

from core.events import broadcast
from core.llm import ask_llm, set_battle_context
from models.vulnerability import BattleGroup, BattleSession

CHALLENGER_SYSTEM = """You are a senior adversarial security researcher reviewing another AI's vulnerability findings.
You must be critical — look for false positives, missed bypasses, or patch weaknesses.

Given a vulnerability finding and its proposed patch from another AI, respond ONLY with JSON:
{
  "verdict": "agree|dispute|partial",
  "confidence": 0.0-1.0,
  "argument": "Your detailed reasoning (2-3 sentences)",
  "missed_variants": ["Any bypass or variant the original missed"],
  "patch_quality_score": 1-10,
  "suggested_improvement": "Better approach if any"
}"""

DEFENDER_SYSTEM = """You are defending your vulnerability finding against a challenge from another AI.
Another AI security researcher has disputed your finding. Defend your analysis or concede valid points.

Respond ONLY with JSON:
{
  "response": "defend|partially_concede|concede",
  "defense": "Your counter-argument (2-3 sentences)",
  "updated_severity": "critical|high|medium|low|info",
  "lesson_learned": "What this debate revealed"
}"""


async def run_cross_examination(
    group: BattleGroup,
    sessions: dict[str, BattleSession],
) -> list[dict]:
    """
    Select the most interesting findings and have LLMs debate them.
    Returns list of examination rounds.
    """
    rounds = []
    provider_list = list(sessions.keys())

    if len(provider_list) < 2:
        return rounds

    await broadcast("cross_exam_started", {"group_id": group.id})

    for i, (provider_name, session) in enumerate(sessions.items()):
        if not session.vulnerabilities:
            continue

        # Pick highest-severity finding from this provider
        top_vuln = max(session.vulnerabilities, key=lambda v: v.cvss_score)
        top_patch = next(
            (p for p in session.patches if p.vulnerability_id == top_vuln.id), None
        )

        # Pick a challenger (next provider in rotation)
        challenger_name = provider_list[(i + 1) % len(provider_list)]
        challenger_session = sessions[challenger_name]

        # Round 1: Challenge
        challenge_prompt = f"""Review this vulnerability finding by {provider_name} ({session.provider_model}):

Title: {top_vuln.title}
Type: {top_vuln.type.value}
Severity: {top_vuln.severity.value}
CVSS: {top_vuln.cvss_score}
Description: {top_vuln.description}
Endpoint: {top_vuln.endpoint}
Payload: {top_vuln.payload}

Proposed patch:
{top_patch.patched_code[:500] if top_patch else 'No patch generated'}

Patch explanation:
{top_patch.explanation if top_patch else 'N/A'}

Is this finding legitimate? Is the patch sufficient? Return ONLY valid JSON."""

        set_battle_context(challenger_name, group.id)
        challenge_raw = await ask_llm(
            CHALLENGER_SYSTEM,
            challenge_prompt,
            max_tokens=1024,
            agent_name=f"Challenger",
        )

        # Parse challenge
        challenge_data = {}
        json_match = re.search(r"\{[\s\S]+\}", challenge_raw)
        if json_match:
            try:
                challenge_data = json.loads(json_match.group())
            except json.JSONDecodeError:
                challenge_data = {"verdict": "partial", "argument": challenge_raw[:300]}

        # Broadcast challenge
        round_data = {
            "round": len(rounds) + 1,
            "vulnerability": {
                "title": top_vuln.title,
                "severity": top_vuln.severity.value,
                "type": top_vuln.type.value,
            },
            "defender": provider_name,
            "defender_model": session.provider_model,
            "challenger": challenger_name,
            "challenger_model": challenger_session.provider_model,
            "challenge": challenge_data,
            "defense": {},
        }

        await broadcast("cross_exam_exchange", {
            "group_id": group.id,
            "phase": "challenge",
            "round": round_data,
        })

        # Round 2: Defense
        defense_prompt = f"""A {challenger_name} security researcher challenges your finding:

Your finding: {top_vuln.title} ({top_vuln.severity.value})
Your patch: {top_patch.explanation if top_patch else 'N/A'}

Their challenge:
Verdict: {challenge_data.get('verdict', 'unknown')}
Argument: {challenge_data.get('argument', challenge_raw[:300])}
Suggested improvement: {challenge_data.get('suggested_improvement', 'N/A')}

Defend your analysis or concede valid points. Return ONLY valid JSON."""

        set_battle_context(provider_name, group.id)
        defense_raw = await ask_llm(
            DEFENDER_SYSTEM,
            defense_prompt,
            max_tokens=1024,
            agent_name=f"Defender",
        )

        # Parse defense
        defense_data = {}
        json_match = re.search(r"\{[\s\S]+\}", defense_raw)
        if json_match:
            try:
                defense_data = json.loads(json_match.group())
            except json.JSONDecodeError:
                defense_data = {"response": "defend", "defense": defense_raw[:300]}

        round_data["defense"] = defense_data

        await broadcast("cross_exam_exchange", {
            "group_id": group.id,
            "phase": "defense",
            "round": round_data,
        })

        rounds.append(round_data)

    await broadcast("cross_exam_complete", {
        "group_id": group.id,
        "rounds": rounds,
    })

    return rounds
