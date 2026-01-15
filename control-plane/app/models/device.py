import uuid
from sqlalchemy import Column, DateTime, JSON, String, Text, func
from app.db.session import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, nullable=True)  # future multi-tenant support
    device_id = Column(String, unique=True, nullable=False)
    device_type = Column(String, nullable=True)
    hardware_metadata = Column(JSON, nullable=True)
    current_bundle_version = Column(String, nullable=True)
    public_key = Column(Text, nullable=False, unique=True)
    registration_token = Column(String, nullable=False, unique=True)
    status = Column(String, nullable=True)  # online/offline/error
    last_heartbeat = Column(DateTime(timezone=True), server_default=func.now())
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    tags = Column(JSON, nullable=True)
