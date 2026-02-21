from fastapi import APIRouter

from core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    settings = get_settings()
    return {
        "status": "ok",
        "model": settings.anthropic_model,
        "env": settings.env,
        "target": settings.target_base_url,
    }
