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
    jwt_secret_key: str = Field(default=os.getenv("JWT_SECRET_KEY", "dev-only-secret-change-me"))
    jwt_algorithm: str = Field(default=os.getenv("JWT_ALGORITHM", "HS256"))
    access_token_expire_minutes: int = Field(
        default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    )
    environment: str = Field(default=os.getenv("ENVIRONMENT", "development"))
    require_admin_auth: bool = Field(
        default=os.getenv("REQUIRE_ADMIN_AUTH", "").lower() in {"1", "true", "yes"}
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
