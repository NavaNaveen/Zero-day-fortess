"""
War General — Orchestrator
Controls the full battle lifecycle across all agents.
"""
import asyncio
import time
from datetime import datetime

from agents.blue_team import compliance, hardening, patcher, verifier
from agents.red_team import business_logic, chain_builder, exploiter, recon
from core.events import broadcast
from core.llm import set_battle_context
from core.llm_providers import LLMProvider, get_provider
from models.vulnerability import BattleSession, BattleState
from tools.github_pr import create_battle_pr


async def _timed(session: BattleSession, agent_name: str, coro):
    """Run a coroutine and track its elapsed time."""
    start = time.monotonic()
    result = await coro
    elapsed = round(time.monotonic() - start, 1)
    session.agent_timings[agent_name] = elapsed
    await broadcast("agent_complete", {"agent": agent_name, "elapsed_seconds": elapsed})
    session.log.append(f"[{agent_name}] Completed in {elapsed}s")
    return result


async def run_battle(session: BattleSession) -> BattleSession:
    """
    Execute full autonomous battle:
    Phase 1: Recon (Spider)
    Phase 2: Parallel Assault (Blade + Phantom)
    Phase 3: Chain Analysis (Venom)
    Phase 4: Defense Loop (Shield → Proof per vuln)
    Phase 5: Hardening (Fortress)
    Phase 6: Compliance Report (Auditor)
    """
    await broadcast("battle_started", {"session_id": session.id})
    session.log.append("[War General] ⚔️  Battle initiated")

    try:
        # ── Phase 1: Recon ────────────────────────────────────────────────────
        session.state = BattleState.RECON
        await broadcast("phase_change", {"phase": "recon", "session_id": session.id})
        session.log.append("[War General] Phase 1: Reconnaissance")
        await _timed(session, "Spider", recon.run(session))

        # ── Phase 2: Parallel Assault ─────────────────────────────────────────
        session.state = BattleState.ASSAULT
        await broadcast("phase_change", {"phase": "assault", "session_id": session.id})
        session.log.append("[War General] Phase 2: Parallel Assault (Blade + Phantom)")
        await asyncio.gather(
            _timed(session, "Blade", exploiter.run(session)),
            _timed(session, "Phantom", business_logic.run(session)),
        )

        # ── Phase 3: Chain Analysis ────────────────────────────────────────────
        session.state = BattleState.CHAINING
        await broadcast("phase_change", {"phase": "chaining", "session_id": session.id})
        session.log.append("[War General] Phase 3: Attack Chain Analysis")
        await _timed(session, "Venom", chain_builder.run(session))

        # ── Phase 4: Defense Loop ──────────────────────────────────────────────
        session.state = BattleState.PATCHING
        await broadcast("phase_change", {"phase": "patching", "session_id": session.id})
        session.log.append(f"[War General] Phase 4: Patching {len(session.vulnerabilities)} vulnerabilities")

        # Sort by severity — fix critical first
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
        sorted_vulns = sorted(
            session.vulnerabilities,
            key=lambda v: severity_order.get(v.severity.value, 5),
        )

        patch_start = time.monotonic()
        for vuln in sorted_vulns:
            patch = await patcher.run(session, vuln)
            if patch:
                verified = await verifier.run(session, vuln, patch)
                if not verified:
                    session.log.append(f"[War General] Retry patch for {vuln.title}")
                    patch2 = await patcher.run(session, vuln)
                    if patch2:
                        await verifier.run(session, vuln, patch2)
        session.agent_timings["Shield"] = round(time.monotonic() - patch_start, 1)

        # ── Phase 5: Hardening ─────────────────────────────────────────────────
        session.state = BattleState.HARDENING
        await broadcast("phase_change", {"phase": "hardening", "session_id": session.id})
        session.log.append("[War General] Phase 5: Systemic Hardening")
        await _timed(session, "Fortress", hardening.run(session))

        # ── Phase 6: Compliance Report ─────────────────────────────────────────
        session.state = BattleState.REPORTING
        await broadcast("phase_change", {"phase": "reporting", "session_id": session.id})
        session.log.append("[War General] Phase 6: Compliance Report")
        await _timed(session, "Auditor", compliance.run(session))

        # ── Phase 7: GitHub PR (optional) ────────────────────────────────────────
        pr_url = await create_battle_pr(session)
        if pr_url:
            session.log.append(f"[War General] 📋 PR created: {pr_url}")

        # ── Done ────────────────────────────────────────────────────────────────
        session.state = BattleState.COMPLETE
        session.completed_at = datetime.utcnow()
        session.log.append(
            f"[War General] ✅ Battle complete! "
            f"{len(session.vulnerabilities)} vulns found, "
            f"{sum(1 for v in session.vulnerabilities if v.patched)} patched, "
            f"{sum(1 for v in session.vulnerabilities if v.verified)} verified"
        )

        await broadcast("phase_change", {"phase": "complete", "session_id": session.id})
        await broadcast("battle_complete", {
            "session_id": session.id,
            "summary": {
                "vulnerabilities": len(session.vulnerabilities),
                "chains": len(session.chains),
                "patches": len(session.patches),
                "verified": sum(1 for v in session.vulnerabilities if v.verified),
                "compliance_score": session.compliance_score,
                "compliance_delta": session.compliance_delta,
                "agent_timings": session.agent_timings,
            },
        })

    except Exception as exc:
        session.log.append(f"[War General] ❌ Battle error: {exc}")
        await broadcast("battle_error", {"session_id": session.id, "error": str(exc)})
        raise

    return session


async def run_battle_with_provider(
    session: BattleSession,
    provider: str,
) -> BattleSession:
    """Run battle with a specific LLM provider via context variable."""
    provider_obj = get_provider(provider)
    session.provider = provider
    session.provider_model = provider_obj.model_name
    set_battle_context(provider, session.id)
    return await run_battle(session)
