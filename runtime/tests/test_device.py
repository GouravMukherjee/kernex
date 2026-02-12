from pathlib import Path

from kernex.device.identity import ensure_keypair
from kernex.device.info import collect_device_info


def test_collect_device_info_contains_expected_fields():
    info = collect_device_info()
    assert "hostname" in info
    assert "platform" in info
    assert "cpu_count" in info
    assert "memory_mb_total" in info
    assert info["cpu_count"] >= 0


def test_ensure_keypair_creates_and_reuses_key(tmp_path: Path):
    key_path = tmp_path / "device_key.pem"
    private1, public1 = ensure_keypair(key_path)
    assert key_path.exists()
    private2, public2 = ensure_keypair(key_path)
    assert private1 == private2
    assert public1 == public2
