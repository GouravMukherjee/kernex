import hashlib
from pathlib import Path
from typing import Any


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_file_checksum(path: Path, expected_sha256: str) -> None:
    actual = sha256_file(path)
    if actual != expected_sha256:
        raise ValueError(f"Checksum mismatch: expected {expected_sha256}, got {actual}")


def verify_manifest_shape(manifest: dict[str, Any]) -> None:
    if not isinstance(manifest, dict):
        raise ValueError("Manifest must be an object")
    if "version" not in manifest:
        raise ValueError("Manifest missing required 'version'")
