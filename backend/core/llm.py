"""
LLM abstraction layer.
Uses context variables so all 8 agents call ask_llm() with zero changes.
The orchestrator sets the provider context before running agents.
"""
import contextvars

from core.config import get_settings
from core.demo_cache import get_cached_response, save_response
from core.events import broadcast
from core.llm_providers import LLMProvider, get_provider

# Context variables for multi-battle routing
_current_provider: contextvars.ContextVar[str] = contextvars.ContextVar(
    "current_provider", default=""
)
_current_battle_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    "current_battle_id", default=""
)


def set_battle_context(provider: str, battle_id: str = "") -> None:
    """Set the LLM provider and battle ID for the current async context."""
    _current_provider.set(provider)
    _current_battle_id.set(battle_id)


def get_current_provider_name() -> str:
    """Get the current provider name from context or settings default."""
    ctx = _current_provider.get()
    if ctx:
        return ctx
    return get_settings().llm_provider


async def ask_llm(
    system: str,
    prompt: str,
    max_tokens: int = 4096,
    agent_name: str = "",
) -> str:
    """Provider-agnostic LLM call. Provider determined by context variable."""
    settings = get_settings()
    provider_name = get_current_provider_name()
    battle_id = _current_battle_id.get()

    # Broadcast that agent is thinking
    if agent_name:
        await broadcast("agent_thinking", {
            "agent": agent_name,
            "status": "thinking",
            "prompt_preview": prompt[:200].replace("\n", " "),
            "provider": provider_name,
            "battle_id": battle_id,
        })

    # Demo mode: return cached response if available
    if settings.demo_mode:
        cached = await get_cached_response(system, prompt, agent_name)
        if cached is not None:
            if agent_name:
                await broadcast("agent_thinking", {
                    "agent": agent_name,
                    "status": "done",
                    "response_preview": cached[:300].replace("\n", " "),
                    "provider": provider_name,
                    "battle_id": battle_id,
                })
            return cached

    # Call the appropriate provider
    provider = get_provider(provider_name)
    response = await provider.generate(system, prompt, max_tokens)
    response_text = response.text

    # Broadcast agent response preview
    if agent_name:
        await broadcast("agent_thinking", {
            "agent": agent_name,
            "status": "done",
            "response_preview": response_text[:300].replace("\n", " "),
            "provider": provider_name,
            "model": response.model,
            "latency_ms": round(response.latency_ms),
            "battle_id": battle_id,
        })

    # Save response to demo cache for future use
    save_response(system, prompt, response_text, agent_name)

    return response_text
