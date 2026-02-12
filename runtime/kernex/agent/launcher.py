import asyncio
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


@dataclass
class LaunchResult:
    return_code: int
    stdout: str
    stderr: str
    duration_seconds: float


async def run_script(
    script: str,
    cwd: Path | None = None,
    timeout_seconds: int = 300,
    env_overrides: Mapping[str, str] | None = None,
) -> LaunchResult:
    """Run a shell script command and return captured output."""
    env = os.environ.copy()
    if env_overrides:
        env.update(dict(env_overrides))

    started_at = time.monotonic()
    process = await asyncio.create_subprocess_shell(
        script,
        cwd=str(cwd) if cwd else None,
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout_seconds)
    except asyncio.TimeoutError as exc:
        process.kill()
        await process.communicate()
        raise RuntimeError(f"Command timed out after {timeout_seconds}s: {script}") from exc

    duration = time.monotonic() - started_at
    return LaunchResult(
        return_code=process.returncode or 0,
        stdout=stdout.decode(errors="replace"),
        stderr=stderr.decode(errors="replace"),
        duration_seconds=duration,
    )
