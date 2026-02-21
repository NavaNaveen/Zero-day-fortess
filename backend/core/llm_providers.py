"""
LLM Provider Abstraction Layer
Supports: Anthropic (Claude), Ollama (local), OpenAI (GPT), Google (Gemini)
"""
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

from core.config import get_settings


class LLMProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    OPENAI = "openai"
    GEMINI = "gemini"


@dataclass
class LLMResponse:
    text: str
    provider: LLMProvider
    model: str
    tokens_used: int
    latency_ms: float


class BaseLLMProvider(ABC):
    provider_name: LLMProvider
    model_name: str = ""

    @abstractmethod
    async def generate(self, system: str, prompt: str, max_tokens: int) -> LLMResponse:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


class AnthropicProvider(BaseLLMProvider):
    provider_name = LLMProvider.ANTHROPIC

    def __init__(self):
        settings = get_settings()
        self.model_name = settings.anthropic_model
        self._api_key = settings.anthropic_api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            import anthropic
            self._client = anthropic.AsyncAnthropic(api_key=self._api_key)
        return self._client

    async def generate(self, system: str, prompt: str, max_tokens: int) -> LLMResponse:
        start = time.monotonic()
        client = self._get_client()
        message = await client.messages.create(
            model=self.model_name,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        latency = (time.monotonic() - start) * 1000
        block = message.content[0]
        if not hasattr(block, "text"):
            raise ValueError(f"Unexpected content block type: {type(block)}")
        return LLMResponse(
            text=block.text,
            provider=LLMProvider.ANTHROPIC,
            model=self.model_name,
            tokens_used=message.usage.input_tokens + message.usage.output_tokens,
            latency_ms=latency,
        )

    def is_available(self) -> bool:
        return bool(self._api_key)


class OllamaProvider(BaseLLMProvider):
    provider_name = LLMProvider.OLLAMA

    def __init__(self):
        settings = get_settings()
        self.model_name = settings.ollama_model
        self._base_url = settings.ollama_base_url
        self._client = None

    def _get_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(
                base_url=f"{self._base_url}/v1",
                api_key="ollama",
            )
        return self._client

    async def generate(self, system: str, prompt: str, max_tokens: int) -> LLMResponse:
        start = time.monotonic()
        client = self._get_client()
        response = await client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        latency = (time.monotonic() - start) * 1000
        text = response.choices[0].message.content or ""
        tokens = response.usage.total_tokens if response.usage else 0
        return LLMResponse(
            text=text,
            provider=LLMProvider.OLLAMA,
            model=self.model_name,
            tokens_used=tokens,
            latency_ms=latency,
        )

    def is_available(self) -> bool:
        import httpx
        try:
            resp = httpx.get(f"{self._base_url}/api/tags", timeout=2.0)
            return resp.status_code == 200
        except Exception:
            return False


class OpenAIProvider(BaseLLMProvider):
    provider_name = LLMProvider.OPENAI

    def __init__(self):
        settings = get_settings()
        self.model_name = settings.openai_model
        self._api_key = settings.openai_api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=self._api_key)
        return self._client

    async def generate(self, system: str, prompt: str, max_tokens: int) -> LLMResponse:
        start = time.monotonic()
        client = self._get_client()
        response = await client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        latency = (time.monotonic() - start) * 1000
        text = response.choices[0].message.content or ""
        tokens = response.usage.total_tokens if response.usage else 0
        return LLMResponse(
            text=text,
            provider=LLMProvider.OPENAI,
            model=self.model_name,
            tokens_used=tokens,
            latency_ms=latency,
        )

    def is_available(self) -> bool:
        return bool(self._api_key)


class GeminiProvider(BaseLLMProvider):
    provider_name = LLMProvider.GEMINI

    def __init__(self):
        settings = get_settings()
        self.model_name = settings.gemini_model
        self._api_key = settings.gemini_api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google import genai
            self._client = genai.Client(api_key=self._api_key)
        return self._client

    async def generate(self, system: str, prompt: str, max_tokens: int) -> LLMResponse:
        start = time.monotonic()
        client = self._get_client()
        response = await client.aio.models.generate_content(
            model=self.model_name,
            contents=f"{system}\n\n{prompt}",
            config={
                "max_output_tokens": max_tokens,
                "temperature": 0.3,
            },
        )
        latency = (time.monotonic() - start) * 1000
        text = response.text or ""
        return LLMResponse(
            text=text,
            provider=LLMProvider.GEMINI,
            model=self.model_name,
            tokens_used=0,
            latency_ms=latency,
        )

    def is_available(self) -> bool:
        return bool(self._api_key)


# ── Provider Registry ──────────────────────────────────────────────────

_providers: dict[LLMProvider, BaseLLMProvider] = {}

PROVIDER_CLASSES: dict[LLMProvider, type[BaseLLMProvider]] = {
    LLMProvider.ANTHROPIC: AnthropicProvider,
    LLMProvider.OLLAMA: OllamaProvider,
    LLMProvider.OPENAI: OpenAIProvider,
    LLMProvider.GEMINI: GeminiProvider,
}


def get_provider(name: LLMProvider | str) -> BaseLLMProvider:
    if isinstance(name, str):
        name = LLMProvider(name)
    if name not in _providers:
        cls = PROVIDER_CLASSES[name]
        _providers[name] = cls()
    return _providers[name]


def get_all_available_providers() -> dict[str, dict]:
    """Return status of all providers."""
    results = {}
    for provider_enum in LLMProvider:
        try:
            provider = get_provider(provider_enum)
            results[provider_enum.value] = {
                "available": provider.is_available(),
                "model": provider.model_name,
            }
        except Exception:
            results[provider_enum.value] = {"available": False, "model": ""}
    return results
