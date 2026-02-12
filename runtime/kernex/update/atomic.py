import os
import shutil
import tempfile
from pathlib import Path


def atomic_write_bytes(target: Path, content: bytes) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(prefix=f".{target.name}.", dir=str(target.parent))
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, target)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def atomic_replace_dir(source_dir: Path, target_dir: Path) -> None:
    """
    Replace target directory atomically using a backup-and-swap strategy.
    """
    source_dir = source_dir.resolve()
    target_dir = target_dir.resolve()
    backup_dir = target_dir.with_name(f"{target_dir.name}.bak")
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    if target_dir.exists():
        os.replace(target_dir, backup_dir)
    os.replace(source_dir, target_dir)
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
