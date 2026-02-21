"""
Battle Royale — Run the same battle across multiple LLM providers in parallel.
"""
import asyncio

from core.events import broadcast
from models.vulnerability import BattleGroup, BattleSession
from services import battle_store
from services.orchestrator import run_battle_with_provider


async def run_battle_royale(
    providers: list[str],
    target_repo_path: str = "",
    target_base_url: str = "",
    github_url: str = "",
) -> BattleGroup:
    """Run the same battle across multiple providers in parallel."""
    group = BattleGroup(
        target_repo=target_repo_path,
        github_url=github_url,
    )

    sessions: list[tuple[BattleSession, str]] = []
    for provider in providers:
        session = BattleSession(
            provider=provider,
            battle_group_id=group.id,
            target_repo_path=target_repo_path,
            target_base_url=target_base_url,
            github_url=github_url,
        )
        group.sessions[provider] = session.id
        battle_store.save(session)
        sessions.append((session, provider))

    battle_store.save_group(group)

    await broadcast("battle_royale_started", {
        "group_id": group.id,
        "providers": providers,
        "sessions": {p: s.id for s, p in sessions},
    })

    # Run all battles in parallel
    tasks = []
    for session, provider in sessions:
        tasks.append(_run_single(session, provider, group))

    await asyncio.gather(*tasks, return_exceptions=True)

    # Build comparison
    comparison = _build_comparison(group, sessions)

    await broadcast("battle_royale_complete", {
        "group_id": group.id,
        "comparison": comparison,
    })

    return group


async def _run_single(session: BattleSession, provider: str, group: BattleGroup):
    """Run a single battle within the royale, handling errors gracefully."""
    try:
        await run_battle_with_provider(session, provider)
    except Exception as exc:
        session.log.append(f"[War General] Battle error for {provider}: {exc}")
    finally:
        group.completed_providers.append(provider)
        battle_store.save(session)


def _build_comparison(group: BattleGroup, sessions: list[tuple[BattleSession, str]]) -> dict:
    """Build comparison data across all providers."""
    comparison = {}
    for session, provider in sessions:
        comparison[provider] = {
            "session_id": session.id,
            "provider": provider,
            "model": session.provider_model,
            "state": session.state.value,
            "vulnerabilities": len(session.vulnerabilities),
            "critical": sum(1 for v in session.vulnerabilities if v.severity.value == "critical"),
            "high": sum(1 for v in session.vulnerabilities if v.severity.value == "high"),
            "chains": len(session.chains),
            "patched": sum(1 for v in session.vulnerabilities if v.patched),
            "verified": sum(1 for v in session.vulnerabilities if v.verified),
            "compliance_score": session.compliance_score,
            "compliance_delta": session.compliance_delta,
            "agent_timings": session.agent_timings,
            "total_time": sum(session.agent_timings.values()),
        }
    return comparison
