from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class DeploymentCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    bundle_version: str
    target_devices: List[str] = Field(default_factory=list)
    description: Optional[str] = None


class DeploymentCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    deployment_id: str
    status: str


class DeploymentDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    bundle_id: str
    bundle_version: str
    status: str
    target_devices: List[str]
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class DeploymentListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    deployments: List[DeploymentDetail] = Field(default_factory=list)
