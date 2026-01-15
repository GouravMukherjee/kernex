import uuid
from sqlalchemy import Column, DateTime, JSON, Integer, String, Text, func, UniqueConstraint
from app.db.session import Base


class Bundle(Base):
    __tablename__ = "bundles"
    __table_args__ = (UniqueConstraint("version", name="uq_bundle_version"),)

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, nullable=True)
    version = Column(String, nullable=False)
    model_name = Column(String, nullable=True)
    model_size_mb = Column(Integer, nullable=True)
    checksum_sha256 = Column(String(64), nullable=False)
    manifest = Column(JSON, nullable=True)
    storage_path = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
