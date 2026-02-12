import time
from dataclasses import dataclass

import psutil


@dataclass
class HealthSnapshot:
    cpu_pct: float
    memory_mb: float
    memory_pct: float
    disk_pct: float
    uptime_seconds: float
    status: str


def _derive_status(cpu_pct: float, memory_pct: float, disk_pct: float) -> str:
    if cpu_pct >= 95 or memory_pct >= 95 or disk_pct >= 98:
        return "error"
    if cpu_pct >= 85 or memory_pct >= 85 or disk_pct >= 90:
        return "degraded"
    return "healthy"


def collect_health_snapshot() -> HealthSnapshot:
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    cpu = psutil.cpu_percent(interval=0.1)
    boot_time = psutil.boot_time()
    uptime = max(0.0, time.time() - boot_time)
    status = _derive_status(cpu, mem.percent, disk.percent)
    return HealthSnapshot(
        cpu_pct=cpu,
        memory_mb=mem.used / (1024 * 1024),
        memory_pct=mem.percent,
        disk_pct=disk.percent,
        uptime_seconds=uptime,
        status=status,
    )
