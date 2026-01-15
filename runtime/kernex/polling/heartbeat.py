import time
import psutil
from typing import Dict, Any


def build_heartbeat_payload(agent_version: str | None = None) -> Dict[str, Any]:
    return {
        "agent_version": agent_version,
        "memory_mb": psutil.virtual_memory().used / (1024 * 1024),
        "cpu_pct": psutil.cpu_percent(interval=0.1),
        "status": "healthy",
    }


def sleep_interval(seconds: int) -> None:
    time.sleep(seconds)
