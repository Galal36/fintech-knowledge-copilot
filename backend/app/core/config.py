from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FinTech Knowledge Copilot API"
    environment: str = "development"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/fintech_knowledge_copilot"
    chroma_persist_directory: str = str(Path("data") / "chroma")
    chroma_collection_name: str = "knowledge_chunks"
    upload_directory: str = str(Path("data") / "uploads")
    gemini_api_key: str | None = None
    gemini_generation_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    chunk_size: int = 1200
    chunk_overlap: int = 200
    max_query_chunks: int = 5
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    Path(settings.chroma_persist_directory).mkdir(parents=True, exist_ok=True)
    Path(settings.upload_directory).mkdir(parents=True, exist_ok=True)
    return settings
