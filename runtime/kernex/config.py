import os
from functools import lru_cache
from pydantic import BaseModel, Field, AnyHttpUrl


class Settings(BaseModel):
    control_plane_url: AnyHttpUrl = Field(
        default=os.getenv("CONTROL_PLANE_URL", "http://localhost:8000/api/v1")
    )
    device_id: str | None = None
    key_path: str = os.getenv("KERNEX_KEY_PATH", "./device_key.pem")
    polling_interval: int = int(os.getenv("POLLING_INTERVAL", "60"))
    config_path: str = os.getenv("KERNEX_CONFIG_PATH", "./device_config.json")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
