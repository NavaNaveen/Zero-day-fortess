"""
In-memory battle session store (suitable for hackathon demo).
"""
from models.vulnerability import BattleSession

_sessions: dict[str, BattleSession] = {}


def save(session: BattleSession) -> None:
    _sessions[session.id] = session


def get(session_id: str) -> BattleSession | None:
    return _sessions.get(session_id)


def all_sessions() -> list[BattleSession]:
    return list(_sessions.values())


def latest() -> BattleSession | None:
    if not _sessions:
        return None
    return sorted(_sessions.values(), key=lambda s: s.started_at, reverse=True)[0]
