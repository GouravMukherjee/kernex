import hashlib
from pathlib import Path

import pytest

from kernex.update.atomic import atomic_write_bytes
from kernex.update.integrity import verify_file_checksum, verify_manifest_shape


def test_atomic_write_bytes_writes_file(tmp_path: Path):
    target = tmp_path / "bundle.bin"
    content = b"kernex-update-content"
    atomic_write_bytes(target, content)
    assert target.exists()
    assert target.read_bytes() == content


def test_verify_file_checksum_passes_and_fails(tmp_path: Path):
    target = tmp_path / "bundle.bin"
    content = b"checksum-data"
    target.write_bytes(content)
    digest = hashlib.sha256(content).hexdigest()
    verify_file_checksum(target, digest)
    with pytest.raises(ValueError):
        verify_file_checksum(target, "deadbeef")


def test_verify_manifest_shape_requires_version():
    verify_manifest_shape({"version": "1.0.0"})
    with pytest.raises(ValueError):
        verify_manifest_shape({})
