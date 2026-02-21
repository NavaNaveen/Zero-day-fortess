import asyncio
from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import Any

_listeners: dict[str, list[Callable[[dict], Awaitable[None]]]] = defaultdict(list)


def on(event: str):
    def decorator(fn: Callable[[dict], Awaitable[None]]):
        _listeners[event].append(fn)
        return fn
    return decorator


async def emit(event: str, data: dict[str, Any]):
    for listener in _listeners.get(event, []):
        await listener(data)


# WebSocket broadcast queue — api/websockets.py drains this
broadcast_queue: asyncio.Queue = asyncio.Queue()


async def broadcast(event: str, payload: dict[str, Any]):
    await broadcast_queue.put({"event": event, "payload": payload})
