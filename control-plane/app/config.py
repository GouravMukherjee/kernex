import os
from functools import lru_cache
from pydantic import BaseModel, Field


class Settings(BaseModel):
    app_name: str = Field(default="kernex-control-plane")
    database_url: str = Field(
        default=os.getenv(
            "DATABASE_URL",
            "sqlite+aiosqlite:///./dev.db",
        )
    )
    api_prefix: str = "/api/v1"
    bundle_storage_path: str = Field(
        default=os.getenv("BUNDLE_STORAGE_PATH", "./data/bundles")
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
