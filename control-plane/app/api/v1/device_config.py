from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.device import Device
from app.models.device_config import DeviceConfig, DeviceBundleHistory
from app.schemas.device_config import (
    DeviceConfigResponse,
    DeviceConfigUpdate,
    DeviceBundleHistoryResponse,
    RollbackRequest,
    RollbackResponse,
)
from app.models.bundle import Bundle
from app.models.deployment import Deployment
import uuid
from datetime import datetime

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("/{device_id}/config", response_model=DeviceConfigResponse)
async def get_device_config(
    device_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get device configuration"""
    result = await session.scalar(
        select(Device).where(Device.device_id == device_id)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Device not found")

    config = await session.scalar(
        select(DeviceConfig).where(DeviceConfig.device_id == result.id)
    )
    
    if not config:
        # Create default config if it doesn't exist
        config = DeviceConfig(device_id=result.id)
        session.add(config)
        await session.commit()
        await session.refresh(config)
    
    return config


@router.put("/{device_id}/config", response_model=DeviceConfigResponse)
async def update_device_config(
    device_id: str,
    config_update: DeviceConfigUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update device configuration"""
    device_result = await session.scalar(
        select(Device).where(Device.device_id == device_id)
    )
    if not device_result:
        raise HTTPException(status_code=404, detail="Device not found")

    config = await session.scalar(
        select(DeviceConfig).where(DeviceConfig.device_id == device_result.id)
    )
    
    if not config:
        config = DeviceConfig(device_id=device_result.id)
        session.add(config)
    
    # Update config fields
    config.polling_interval = config_update.polling_interval
    config.heartbeat_timeout = config_update.heartbeat_timeout
    config.deploy_timeout = config_update.deploy_timeout
    config.log_level = config_update.log_level
    config.metadata_json = config_update.metadata_json
    
    # Increment version
    config.version = str(int(config.version or "1") + 1)
    
    session.add(config)
    await session.commit()
    await session.refresh(config)
    
    return config


@router.get("/{device_id}/bundle-history", response_model=list[DeviceBundleHistoryResponse])
async def get_device_bundle_history(
    device_id: str,
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    """Get device bundle deployment history for rollback selection"""
    device_result = await session.scalar(
        select(Device).where(Device.device_id == device_id)
    )
    if not device_result:
        raise HTTPException(status_code=404, detail="Device not found")

    result = await session.execute(
        select(DeviceBundleHistory)
        .where(DeviceBundleHistory.device_id == device_result.id)
        .order_by(DeviceBundleHistory.deployed_at.desc())
        .limit(limit)
    )
    history = result.scalars().all()
    return history


@router.post("/rollback", response_model=RollbackResponse)
async def rollback_bundle(
    rollback_req: RollbackRequest,
    session: AsyncSession = Depends(get_session),
):
    """Create rollback deployment to previous bundle version"""
    
    # Validate bundle version exists
    bundle = await session.scalar(
        select(Bundle).where(Bundle.version == rollback_req.bundle_version)
    )
    if not bundle:
        raise HTTPException(
            status_code=400,
            detail=f"Bundle version {rollback_req.bundle_version} not found"
        )
    
    # Validate all target devices exist and have history with this version
    for device_id in rollback_req.target_device_ids:
        device = await session.scalar(
            select(Device).where(Device.device_id == device_id)
        )
        if not device:
            raise HTTPException(
                status_code=400,
                detail=f"Device {device_id} not found"
            )
        
        # Check if device has deployed this bundle before
        history = await session.scalar(
            select(DeviceBundleHistory).where(
                (DeviceBundleHistory.device_id == device.id) &
                (DeviceBundleHistory.bundle_version == rollback_req.bundle_version) &
                (DeviceBundleHistory.status == "success")
            )
        )
        if not history:
            raise HTTPException(
                status_code=400,
                detail=f"Device {device_id} has no successful deployment of version {rollback_req.bundle_version}"
            )
    
    # Create rollback deployment
    deployment = Deployment(
        bundle_id=bundle.id,
        target_device_ids=rollback_req.target_device_ids,
        status="pending",
    )
    session.add(deployment)
    await session.commit()
    await session.refresh(deployment)
    
    return RollbackResponse(
        deployment_id=deployment.id,
        status=deployment.status,
        target_device_ids=deployment.target_device_ids,
        bundle_version=rollback_req.bundle_version,
    )
