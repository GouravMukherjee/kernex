import uuid
from sqlalchemy import Column, DateTime, Float, String, func, ForeignKey
from app.db.session import Base


class Heartbeat(Base):
    __tablename__ = "heartbeats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String, ForeignKey("devices.device_id"), nullable=False, index=True)
    agent_version = Column(String, nullable=True)
    memory_mb = Column(Float, nullable=True)
    cpu_pct = Column(Float, nullable=True)
    status = Column(String, nullable=True)  # healthy/degraded/error
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
