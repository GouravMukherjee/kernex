from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class DeviceConfigBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    polling_interval: str = "60"
    heartbeat_timeout: str = "30"
    deploy_timeout: str = "300"
    log_level: str = "INFO"
    metadata_json: Optional[dict] = None


class DeviceConfigUpdate(DeviceConfigBase):
    model_config = ConfigDict(from_attributes=True)


class DeviceConfigResponse(DeviceConfigBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    device_id: str
    version: str
    updated_at: datetime
    created_at: datetime


class DeviceBundleHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    device_id: str
    bundle_version: str
    bundle_id: str
    deployment_id: Optional[str]
    status: str
    error_message: Optional[str]
    deployed_at: datetime
    duration_seconds: Optional[str]


class RollbackRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    bundle_version: str
    target_device_ids: list[str]


class RollbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    deployment_id: str
    status: str
    target_device_ids: list[str]
    bundle_version: str
