import anthropic

from core.config import get_settings

_client: anthropic.AsyncAnthropic | None = None


def get_llm_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        settings = get_settings()
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def ask_llm(
    system: str,
    prompt: str,
    max_tokens: int = 4096,
) -> str:
    settings = get_settings()
    client = get_llm_client()
    message = await client.messages.create(
        model=settings.anthropic_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    block = message.content[0]
    if not hasattr(block, "text"):
        raise ValueError(f"Unexpected content block type: {type(block)}")
    return block.text
