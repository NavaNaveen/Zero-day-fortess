from fastapi import APIRouter, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect

from api.websockets import manager
from models.vulnerability import BattleSession
from services import battle_store, orchestrator

router = APIRouter(prefix="/battle", tags=["battle"])


@router.post("/start")
async def start_battle(background_tasks: BackgroundTasks):
    """Start a new autonomous battle session."""
    session = BattleSession()
    battle_store.save(session)

    async def _run():
        await orchestrator.run_battle(session)
        battle_store.save(session)

    background_tasks.add_task(_run)
    return {"session_id": session.id, "status": "started"}


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
