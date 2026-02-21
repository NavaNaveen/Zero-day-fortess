"""
Demo mode cache — returns pre-recorded LLM responses for fast,
reliable demos without needing an API key or waiting for LLM latency.
"""

import asyncio
import hashlib
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "demo_data"
CACHE_DIR.mkdir(exist_ok=True)

# Artificial delays per agent for dramatic pacing (seconds)
AGENT_DELAYS = {
    "Spider": 1.5,
    "Blade": 2.0,
    "Phantom": 1.5,
    "Venom": 1.0,
    "Shield": 1.0,
    "Proof": 0.5,
    "Fortress": 1.0,
    "Auditor": 1.5,
}


def _cache_key(system: str, prompt: str) -> str:
    """Generate a deterministic key from system+prompt."""
    h = hashlib.sha256(f"{system[:200]}:{prompt[:500]}".encode()).hexdigest()[:16]
    return h


def save_response(system: str, prompt: str, response: str, agent_name: str = "") -> None:
    """Save an LLM response to the demo cache."""
    key = _cache_key(system, prompt)
    data = {
        "agent": agent_name,
        "system_preview": system[:200],
        "prompt_preview": prompt[:300],
        "response": response,
    }
    path = CACHE_DIR / f"{key}.json"
    path.write_text(json.dumps(data, indent=2))
    logger.info(f"Demo cache: saved {key} ({agent_name})")


async def get_cached_response(system: str, prompt: str, agent_name: str = "") -> str | None:
    """Return a cached response with artificial delay, or None if not cached."""
    key = _cache_key(system, prompt)
    path = CACHE_DIR / f"{key}.json"

    if not path.exists():
        logger.warning(f"Demo cache miss: {key} ({agent_name})")
        return None

    data = json.loads(path.read_text())
    delay = AGENT_DELAYS.get(agent_name, 1.0)
    await asyncio.sleep(delay)

    logger.info(f"Demo cache hit: {key} ({agent_name})")
    return data["response"]
