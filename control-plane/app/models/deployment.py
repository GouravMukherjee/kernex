import uuid
from sqlalchemy import Column, DateTime, String, Text, JSON, func, ForeignKey
from app.db.session import Base


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, nullable=True)
    bundle_id = Column(String, ForeignKey("bundles.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, in_progress, success, failed, rolled_back
    target_device_ids = Column(JSON, nullable=False, default=list)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
