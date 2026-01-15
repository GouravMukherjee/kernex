import hashlib
import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.db.session import get_session
from app.models.bundle import Bundle
from app.schemas.bundle import BundleCreateResponse, BundleListResponse, BundleListItem

router = APIRouter(prefix="/bundles", tags=["bundles"])


async def _compute_sha256(file_path: Path) -> str:
    h = hashlib.sha256()
    with file_path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


@router.post(
    "",
    response_model=BundleCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_bundle(
    file: UploadFile = File(...),
    manifest: str = Form(...),
    session: AsyncSession = Depends(get_session),
) -> BundleCreateResponse:
    settings = get_settings()
    try:
        manifest_json = json.loads(manifest)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid manifest JSON")

    version = manifest_json.get("version")
    if not version:
        raise HTTPException(status_code=400, detail="Manifest must include version")

    storage_dir = Path(settings.bundle_storage_path)
    storage_dir.mkdir(parents=True, exist_ok=True)
    target_path = storage_dir / f"{version}-{file.filename}"

    content = await file.read()
    target_path.write_bytes(content)
    checksum = hashlib.sha256(content).hexdigest()

    existing = await session.scalar(select(Bundle).where(Bundle.version == version))
    if existing:
        raise HTTPException(status_code=409, detail="Bundle version already exists")

    bundle = Bundle(
        version=version,
        model_name=manifest_json.get("model", {}).get("name") if isinstance(manifest_json.get("model"), dict) else None,
        model_size_mb=manifest_json.get("model", {}).get("size_mb") if isinstance(manifest_json.get("model"), dict) else None,
        checksum_sha256=checksum,
        manifest=manifest_json,
        storage_path=str(target_path),
    )
    session.add(bundle)
    await session.commit()
    return BundleCreateResponse(bundle_id=bundle.id, version=version, checksum_sha256=checksum)


@router.get("", response_model=BundleListResponse, status_code=status.HTTP_200_OK)
async def list_bundles(session: AsyncSession = Depends(get_session)) -> BundleListResponse:
    result = await session.execute(select(Bundle))
    bundles = result.scalars().all()
    return BundleListResponse(
        bundles=[
            BundleListItem(
                id=b.id,
                version=b.version,
                checksum_sha256=b.checksum_sha256,
                created_at=b.created_at.isoformat() if b.created_at else None,
            )
            for b in bundles
        ]
    )


@router.get("/{bundle_id}", status_code=status.HTTP_200_OK)
async def download_bundle(bundle_id: str, session: AsyncSession = Depends(get_session)):
    bundle = await session.scalar(select(Bundle).where(Bundle.id == bundle_id))
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    path = Path(bundle.storage_path)
    if not path.exists():
        raise HTTPException(status_code=410, detail="Bundle file missing")
    return FileResponse(
        path=path,
        filename=path.name,
        media_type="application/octet-stream"
    )


@router.post("/{bundle_id}/verify", status_code=status.HTTP_200_OK)
async def verify_bundle(
    bundle_id: str, provided_checksum: Optional[str] = None, session: AsyncSession = Depends(get_session)
):
    bundle = await session.scalar(select(Bundle).where(Bundle.id == bundle_id))
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    path = Path(bundle.storage_path)
    if not path.exists():
        raise HTTPException(status_code=410, detail="Bundle file missing")
    actual_checksum = await _compute_sha256(path)
    return {"valid": provided_checksum == actual_checksum if provided_checksum else True, "checksum": actual_checksum}
