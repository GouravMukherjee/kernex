import time
from typing import Dict, Any

from kernex.agent.monitor import collect_health_snapshot


def build_heartbeat_payload(agent_version: str | None = None) -> Dict[str, Any]:
    snapshot = collect_health_snapshot()
    return {
        "agent_version": agent_version,
        "memory_mb": snapshot.memory_mb,
        "cpu_pct": snapshot.cpu_pct,
        "status": snapshot.status,
    }


def sleep_interval(seconds: int) -> None:
    time.sleep(seconds)
