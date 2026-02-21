from fastapi import APIRouter

from core.config import get_settings
from core.llm_providers import get_all_available_providers

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    settings = get_settings()
    return {
        "status": "ok",
        "provider": settings.llm_provider,
        "env": settings.env,
        "target": settings.target_base_url,
    }


@router.get("/health/providers")
async def provider_health():
    """Check availability of all configured LLM providers."""
    return get_all_available_providers()
