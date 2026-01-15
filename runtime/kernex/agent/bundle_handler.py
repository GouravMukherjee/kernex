"""
Bundle operations: download, extract, and verification.
"""
import asyncio
import hashlib
import json
import tarfile
from pathlib import Path
from typing import Optional, Dict, Any

import httpx


async def download_bundle(control_plane_url: str, bundle_id: str, target_dir: Path) -> Path:
    """
    Download bundle from control plane and save to target directory.
    
    Args:
        control_plane_url: Base URL of control plane API (e.g., http://localhost:8000/api/v1)
        bundle_id: UUID of bundle to download
        target_dir: Directory to save the bundle file
    
    Returns:
        Path to downloaded bundle file
    
    Raises:
        HTTPError: If download fails
        IOError: If file write fails
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    url = f"{control_plane_url}/bundles/{bundle_id}"
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            
            # Extract filename from Content-Disposition or use bundle_id
            filename = bundle_id
            if "content-disposition" in response.headers:
                # Parse: attachment; filename="version-filename.tar.gz"
                cd = response.headers["content-disposition"]
                if "filename=" in cd:
                    filename = cd.split('filename="')[-1].rstrip('"')
            
            bundle_path = target_dir / filename
            async with await asyncio.to_thread(bundle_path.open, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    await asyncio.to_thread(f.write, chunk)
    
    return bundle_path


async def compute_sha256(file_path: Path) -> str:
    """Compute SHA256 checksum of file asynchronously."""
    def _compute():
        h = hashlib.sha256()
        with file_path.open("rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    
    return await asyncio.to_thread(_compute)


async def verify_checksum(file_path: Path, expected_checksum: str) -> bool:
    """
    Verify file checksum against expected value.
    
    Returns:
        True if checksums match
    
    Raises:
        ValueError: If checksums don't match
    """
    actual = await compute_sha256(file_path)
    if actual != expected_checksum:
        raise ValueError(
            f"Checksum mismatch: expected {expected_checksum}, got {actual}"
        )
    return True


async def extract_bundle(bundle_path: Path, extract_dir: Path) -> Path:
    """
    Extract tar.gz bundle to directory.
    
    Args:
        bundle_path: Path to bundle .tar.gz file
        extract_dir: Directory to extract to
    
    Returns:
        Path to extracted bundle root directory
    
    Raises:
        tarfile.TarError: If extraction fails
    """
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    def _extract():
        with tarfile.open(bundle_path, "r:gz") as tar:
            tar.extractall(path=extract_dir)
        # Most bundles have a top-level directory; if so, return its path
        # Otherwise return extract_dir
        contents = list(extract_dir.iterdir())
        if len(contents) == 1 and contents[0].is_dir():
            return contents[0]
        return extract_dir
    
    return await asyncio.to_thread(_extract)


async def load_manifest(bundle_dir: Path) -> Dict[str, Any]:
    """
    Load manifest.json from extracted bundle.
    
    Args:
        bundle_dir: Path to extracted bundle root directory
    
    Returns:
        Parsed manifest JSON
    
    Raises:
        FileNotFoundError: If manifest.json not found
        json.JSONDecodeError: If manifest is invalid JSON
    """
    manifest_path = bundle_dir / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"manifest.json not found in {bundle_dir}")
    
    with manifest_path.open() as f:
        return json.load(f)


async def validate_manifest(manifest: Dict[str, Any]) -> bool:
    """
    Validate manifest structure and required fields.
    
    Returns:
        True if manifest is valid
    
    Raises:
        ValueError: If manifest validation fails
    """
    if not isinstance(manifest, dict):
        raise ValueError("Manifest must be a JSON object")
    
    required_fields = ["version"]
    for field in required_fields:
        if field not in manifest:
            raise ValueError(f"Manifest missing required field: {field}")
    
    return True
