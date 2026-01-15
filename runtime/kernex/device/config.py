import json
from pathlib import Path
from typing import Optional, Tuple


def load_device_config(path: Path) -> Tuple[Optional[str], Optional[str]]:
    """Load device_id and registration_token from disk if present."""
    if not path.exists():
        return None, None
    try:
        data = json.loads(path.read_text())
        return data.get("device_id"), data.get("registration_token")
    except Exception:
        return None, None


def save_device_config(path: Path, device_id: str, registration_token: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"device_id": device_id, "registration_token": registration_token}
    path.write_text(json.dumps(payload))
