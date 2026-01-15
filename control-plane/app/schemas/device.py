from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List


class DeviceRegisterRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={"example": {"public_key": "...", "device_type": "test"}})
    
    public_key: str = Field(..., description="PEM-encoded RSA public key")
    device_type: Optional[str] = None
    hardware_metadata: Optional[Dict[str, Any]] = None
    org_id: Optional[str] = None


class DeviceRegisterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    device_id: str
    registration_token: str


class HeartbeatRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    agent_version: Optional[str] = None
    memory_mb: Optional[float] = None
    cpu_pct: Optional[float] = None
    status: Optional[str] = None


class HeartbeatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    commands: list[dict] = Field(default_factory=list)


class DeviceDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    device_id: str
    device_type: Optional[str] = None
    hardware_metadata: Optional[Dict[str, Any]] = None
    current_bundle_version: Optional[str] = None
    status: Optional[str] = None
    last_heartbeat: Optional[str] = None
    registered_at: Optional[str] = None


class DeviceListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    devices: List[DeviceDetail] = Field(default_factory=list)
    total: int = 0
