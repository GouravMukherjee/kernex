import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.models.device import Device
from app.models.heartbeat import Heartbeat
from app.models.deployment import Deployment
from app.models.bundle import Bundle
from app.models.device_config import DeviceConfig
from app.schemas.device import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceDetail,
    DeviceListResponse,
    HeartbeatRequest,
    HeartbeatResponse,
)

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/register", response_model=DeviceRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    payload: DeviceRegisterRequest, session: AsyncSession = Depends(get_session)
) -> DeviceRegisterResponse:
    # Reject re-registering the same public key
    existing = await session.scalar(select(Device).where(Device.public_key == payload.public_key))
    if existing:
        return DeviceRegisterResponse(
            device_id=existing.device_id, registration_token=existing.registration_token
        )

    device_id = str(uuid.uuid4())
    registration_token = str(uuid.uuid4())

    device = Device(
        device_id=device_id,
        org_id=payload.org_id,
        device_type=payload.device_type,
        hardware_metadata=payload.hardware_metadata,
        public_key=payload.public_key,
        registration_token=registration_token,
        status="online",
    )
    session.add(device)
    await session.commit()
    return DeviceRegisterResponse(device_id=device_id, registration_token=registration_token)


@router.get("")
async def list_devices(session: AsyncSession = Depends(get_session)) -> DeviceListResponse:
    result = await session.execute(select(Device))
    devices = result.scalars().all()
    return DeviceListResponse(
        devices=[
            DeviceDetail(
                device_id=d.device_id,
                device_type=d.device_type,
                hardware_metadata=d.hardware_metadata,
                current_bundle_version=d.current_bundle_version,
                status=d.status,
                last_heartbeat=d.last_heartbeat.isoformat() if d.last_heartbeat else None,
                registered_at=d.registered_at.isoformat() if d.registered_at else None,
            )
            for d in devices
        ],
        total=len(devices),
    )


@router.get("/{device_id}")
async def get_device(device_id: str, session: AsyncSession = Depends(get_session)) -> DeviceDetail:
    device = await session.scalar(select(Device).where(Device.device_id == device_id))
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceDetail(
        device_id=device.device_id,
        device_type=device.device_type,
        hardware_metadata=device.hardware_metadata,
        current_bundle_version=device.current_bundle_version,
        status=device.status,
        last_heartbeat=device.last_heartbeat.isoformat() if device.last_heartbeat else None,
        registered_at=device.registered_at.isoformat() if device.registered_at else None,
    )


@router.post(
    "/{device_id}/heartbeat",
    response_model=HeartbeatResponse,
    status_code=status.HTTP_200_OK,
)
async def post_heartbeat(
    device_id: str,
    payload: HeartbeatRequest,
    session: AsyncSession = Depends(get_session),
) -> HeartbeatResponse:
    device = await session.scalar(select(Device).where(Device.device_id == device_id))
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    hb = Heartbeat(
        device_id=device_id,
        agent_version=payload.agent_version,
        memory_mb=payload.memory_mb,
        cpu_pct=payload.cpu_pct,
        status=payload.status,
    )
    device.status = payload.status or device.status
    session.add(hb)
    await session.flush()  # Ensure heartbeat gets its timestamp from DB
    device.last_heartbeat = hb.timestamp
    
    # Build commands: any pending deployments targeting this device
    result = await session.execute(select(Deployment).where(Deployment.status == "pending"))
    deployments_all = result.scalars().all()
    deployments = [d for d in deployments_all if device_id in (d.target_device_ids or [])]
    commands = []
    if deployments:
        # fetch bundle data
        bundle_ids = {d.bundle_id for d in deployments}
        bundle_map = {}
        if bundle_ids:
            bundles = await session.execute(select(Bundle).where(Bundle.id.in_(bundle_ids)))
            for b in bundles.scalars():
                bundle_map[b.id] = {"id": b.id, "version": b.version}
        for d in deployments:
            bundle_data = bundle_map.get(d.bundle_id, {})
            commands.append(
                {
                    "type": "deploy",
                    "deployment_id": d.id,
                    "bundle_id": bundle_data.get("id", ""),
                    "bundle_version": bundle_data.get("version", ""),
                }
            )
            d.status = "in_progress"
    
    # Check for config updates - if device has pending config changes
    config = await session.scalar(
        select(DeviceConfig).where(DeviceConfig.device_id == device.id)
    )
    if config:
        # Include config in commands if it exists
        commands.append(
            {
                "type": "configure",
                "config_version": config.version,
                "polling_interval": config.polling_interval,
                "heartbeat_timeout": config.heartbeat_timeout,
                "deploy_timeout": config.deploy_timeout,
                "log_level": config.log_level,
            }
        )
    
    await session.commit()
    return HeartbeatResponse(commands=commands)
