import platform
import socket
from typing import Any

import psutil


def collect_device_info() -> dict[str, Any]:
    """Collect lightweight hardware and OS metadata."""
    vm = psutil.virtual_memory()
    cpus = psutil.cpu_count(logical=True) or 0
    return {
        "hostname": socket.gethostname(),
        "platform": platform.system(),
        "platform_release": platform.release(),
        "machine": platform.machine(),
        "python_version": platform.python_version(),
        "cpu_count": cpus,
        "memory_mb_total": round(vm.total / (1024 * 1024), 2),
    }
