import uuid
from sqlalchemy import Column, DateTime, String, JSON, func, ForeignKey
from app.db.session import Base


class DeviceConfig(Base):
    """Device configuration management - tracks config updates and history"""
    __tablename__ = "device_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String, ForeignKey("devices.id"), nullable=False, unique=True)
    
    # Configuration fields
    polling_interval = Column(String, default="60")  # seconds
    heartbeat_timeout = Column(String, default="30")  # seconds
    deploy_timeout = Column(String, default="300")  # seconds
    log_level = Column(String, default="INFO")  # DEBUG, INFO, WARNING, ERROR
    
    # Custom metadata
    metadata_json = Column(JSON, nullable=True, default=dict)
    
    # Tracking
    version = Column(String, default="1")  # config version number
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DeviceBundleHistory(Base):
    """Track bundle deployment history for rollback capability"""
    __tablename__ = "device_bundle_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String, ForeignKey("devices.id"), nullable=False)
    bundle_version = Column(String, nullable=False)
    bundle_id = Column(String, nullable=False)
    deployment_id = Column(String, nullable=True)
    
    # Status of this deployment
    status = Column(String, nullable=False)  # success, failed, rolled_back
    error_message = Column(String, nullable=True)
    
    # Tracking
    deployed_at = Column(DateTime(timezone=True), server_default=func.now())
    duration_seconds = Column(String, nullable=True)  # how long the deployment took
