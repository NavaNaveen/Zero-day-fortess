from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, WebSocket, WebSocketDisconnect

from api.websockets import manager
from core.config import get_settings
from models.vulnerability import BattleSession
from services import battle_store
from services.orchestrator import run_battle_with_provider

router = APIRouter(prefix="/battle", tags=["battle"])


@router.post("/start")
async def start_battle(
    background_tasks: BackgroundTasks,
    provider: str = Query(default="", description="LLM provider to use"),
    github_url: str = Query(default="", description="GitHub repo URL to scan"),
):
    """Start a new autonomous battle session."""
    settings = get_settings()
    chosen_provider = provider or settings.llm_provider

    session = BattleSession(provider=chosen_provider)

    if github_url:
        session.github_url = github_url

    battle_store.save(session)

    async def _run():
        if github_url:
            from tools.repo_cloner import clone_github_repo
            repo_path = await clone_github_repo(github_url)
            session.target_repo_path = repo_path

        await run_battle_with_provider(session, chosen_provider)
        battle_store.save(session)

    background_tasks.add_task(_run)
    return {"session_id": session.id, "status": "started", "provider": chosen_provider}


@router.post("/royale")
async def start_battle_royale(
    background_tasks: BackgroundTasks,
    providers: str = Query(default="ollama", description="Comma-separated providers"),
    github_url: str = Query(default="", description="GitHub repo URL to scan"),
):
    """Start Battle Royale across multiple LLM providers."""
    provider_list = [p.strip() for p in providers.split(",") if p.strip()]

    if not provider_list:
        raise HTTPException(status_code=400, detail="At least one provider required")

    async def _run():
        target_repo_path = ""
        target_base_url = get_settings().target_base_url

        if github_url:
            from tools.repo_cloner import clone_github_repo
            target_repo_path = await clone_github_repo(github_url)

        from services.battle_royale import run_battle_royale
        group = await run_battle_royale(
            providers=provider_list,
            target_repo_path=target_repo_path,
            target_base_url=target_base_url,
            github_url=github_url,
        )

        # Auto-trigger cross-examination if 2+ providers
        if len(provider_list) >= 2:
            from services.cross_examination import run_cross_examination
            sessions = {}
            for prov, sid in group.sessions.items():
                s = battle_store.get(sid)
                if s:
                    sessions[prov] = s
            await run_cross_examination(group, sessions)

    background_tasks.add_task(_run)
    return {"status": "started", "providers": provider_list}


@router.get("/royale/{group_id}")
async def get_battle_royale(group_id: str):
    """Get all sessions in a Battle Royale group."""
    group = battle_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Battle group not found")

    sessions = {}
    for prov, session_id in group.sessions.items():
        session = battle_store.get(session_id)
        if session:
            sessions[prov] = session.model_dump(mode="json")

    return {
        "group": group.model_dump(mode="json"),
        "sessions": sessions,
    }


@router.get("/sessions")
async def list_sessions():
    sessions = battle_store.all_sessions()
    return [
        {
            "id": s.id,
            "state": s.state,
            "started_at": s.started_at,
            "completed_at": s.completed_at,
            "vulnerability_count": len(s.vulnerabilities),
            "chain_count": len(s.chains),
            "patch_count": len(s.patches),
            "compliance_score": s.compliance_score,
            "provider": s.provider,
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = battle_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.model_dump(mode="json")


@router.get("/sessions/{session_id}/log")
async def get_log(session_id: str):
    session = battle_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"log": session.log}


@router.get("/latest")
async def latest_session():
    session = battle_store.latest()
    if not session:
        raise HTTPException(status_code=404, detail="No sessions yet")
    return session.model_dump(mode="json")


@router.websocket("/ws")
async def battle_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
