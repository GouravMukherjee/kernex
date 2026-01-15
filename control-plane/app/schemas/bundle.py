from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict


class BundleCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    bundle_id: str
    version: str
    checksum_sha256: str


class BundleListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    version: str
    checksum_sha256: str
    created_at: Optional[str] = None


class BundleListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    bundles: list[BundleListItem] = Field(default_factory=list)
