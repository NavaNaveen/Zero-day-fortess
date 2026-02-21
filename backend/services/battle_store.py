"""
In-memory battle session store (suitable for hackathon demo).
"""
from models.vulnerability import BattleGroup, BattleSession

_sessions: dict[str, BattleSession] = {}
_groups: dict[str, BattleGroup] = {}


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


def save_group(group: BattleGroup) -> None:
    _groups[group.id] = group


def get_group(group_id: str) -> BattleGroup | None:
    return _groups.get(group_id)
