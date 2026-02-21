from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    # LLM Provider Selection
    llm_provider: str = "ollama"  # anthropic | ollama | openai | gemini

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    # Ollama (local)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Server
    backend_port: int = 8000
    backend_host: str = "0.0.0.0"
    env: str = "development"
    secret_key: str = "change-me"

    # Target
    target_repo_path: str = "../vulnerable-app"
    target_base_url: str = "http://localhost:3001"

    # Demo
    demo_mode: bool = False

    # GitHub
    github_token: str = ""
    github_repo_owner: str = ""
    github_repo_name: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
