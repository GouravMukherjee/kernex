from pathlib import Path

from kernex.agent.bundle_handler import extract_bundle, load_manifest, validate_manifest
from kernex.update.integrity import verify_file_checksum, verify_manifest_shape


async def apply_update_bundle(
    bundle_path: Path,
    extract_dir: Path,
    expected_sha256: str | None = None,
) -> Path:
    """
    Validate and extract an update bundle.
    Returns the extracted bundle directory.
    """
    if expected_sha256:
        verify_file_checksum(bundle_path, expected_sha256)
    extracted = await extract_bundle(bundle_path, extract_dir)
    manifest = await load_manifest(extracted)
    verify_manifest_shape(manifest)
    await validate_manifest(manifest)
    return extracted
