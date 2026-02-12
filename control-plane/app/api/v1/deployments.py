from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.api.dependencies import require_admin_user
from app.models.bundle import Bundle
from app.models.deployment import Deployment
from app.models.device import Device
from app.models.device_config import DeviceBundleHistory
from app.schemas.deployment import (
    DeploymentCreateRequest,
    DeploymentCreateResponse,
    DeploymentDetail,
    DeploymentListResponse,
)

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.post("", response_model=DeploymentCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_deployment(
    payload: DeploymentCreateRequest,
    _admin=Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> DeploymentCreateResponse:
    bundle = await session.scalar(select(Bundle).where(Bundle.version == payload.bundle_version))
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle version not found")
    deployment = Deployment(
        bundle_id=bundle.id,
        target_device_ids=payload.target_devices,
        status="pending",
    )
    session.add(deployment)
    await session.commit()
    return DeploymentCreateResponse(deployment_id=deployment.id, status=deployment.status)


@router.get("", response_model=DeploymentListResponse, status_code=status.HTTP_200_OK)
async def list_deployments(
    _admin=Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> DeploymentListResponse:
    result = await session.execute(select(Deployment))
    deployments = result.scalars().all()
    # fetch bundle versions
    bundle_ids = {d.bundle_id for d in deployments}
    bundle_map = {}
    if bundle_ids:
        bundles = await session.execute(select(Bundle).where(Bundle.id.in_(bundle_ids)))
        for b in bundles.scalars():
            bundle_map[b.id] = b.version
    return DeploymentListResponse(
        deployments=[
            DeploymentDetail(
                id=d.id,
                bundle_id=d.bundle_id,
                bundle_version=bundle_map.get(d.bundle_id, ""),
                status=d.status,
                target_devices=d.target_device_ids,
                created_at=d.created_at.isoformat() if d.created_at else None,
                completed_at=d.completed_at.isoformat() if d.completed_at else None,
                error_message=d.error_message,
            )
            for d in deployments
        ]
    )


@router.get("/{deployment_id}", response_model=DeploymentDetail, status_code=status.HTTP_200_OK)
async def get_deployment(
    deployment_id: str,
    _admin=Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> DeploymentDetail:
    deployment = await session.scalar(select(Deployment).where(Deployment.id == deployment_id))
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    bundle = await session.scalar(select(Bundle).where(Bundle.id == deployment.bundle_id))
    return DeploymentDetail(
        id=deployment.id,
        bundle_id=deployment.bundle_id,
        bundle_version=bundle.version if bundle else "",
        status=deployment.status,
        target_devices=deployment.target_device_ids,
        created_at=deployment.created_at.isoformat() if deployment.created_at else None,
        completed_at=deployment.completed_at.isoformat() if deployment.completed_at else None,
        error_message=deployment.error_message,
    )


@router.post("/{deployment_id}/rollback", status_code=status.HTTP_202_ACCEPTED)
async def rollback_deployment(
    deployment_id: str,
    _admin=Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    deployment = await session.scalar(select(Deployment).where(Deployment.id == deployment_id))
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    deployment.status = "rolled_back"
    deployment.completed_at = datetime.utcnow()
    await session.commit()
    return {"deployment_id": deployment.id, "status": deployment.status}


@router.post("/{deployment_id}/result", status_code=status.HTTP_200_OK)
async def deployment_result(
    deployment_id: str,
    device_id: str,
    status_str: str,
    error_message: str = None,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Report deployment result from device.
    
    Args:
        deployment_id: ID of deployment being reported
        device_id: ID of device reporting result
        status_str: "success" or "failed"
        error_message: Error details if failed
    """
    deployment = await session.scalar(select(Deployment).where(Deployment.id == deployment_id))
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Verify device is in target list
    if device_id not in (deployment.target_device_ids or []):
        raise HTTPException(status_code=403, detail="Device not in deployment targets")
    
    # Get device
    device = await session.scalar(select(Device).where(Device.device_id == device_id))
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get bundle
    bundle = await session.scalar(select(Bundle).where(Bundle.id == deployment.bundle_id))
    
    if status_str == "success":
        deployment.status = "success"
        # Update device current bundle version
        device.current_bundle_version = bundle.version if bundle else None
    elif status_str == "failed":
        deployment.status = "failed"
        deployment.error_message = error_message
    else:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status_str}")
    
    # Record in bundle history for rollback capability
    history = DeviceBundleHistory(
        device_id=device.id,
        bundle_version=bundle.version if bundle else "unknown",
        bundle_id=bundle.id if bundle else deployment.bundle_id,
        deployment_id=deployment_id,
        status=status_str,
        error_message=error_message,
    )
    session.add(history)
    
    await session.commit()
    return {"success": True, "deployment_id": deployment_id}
