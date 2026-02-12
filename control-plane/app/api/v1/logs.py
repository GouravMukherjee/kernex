from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin_user
from app.db.session import get_session
from app.models.deployment import Deployment
from app.models.heartbeat import Heartbeat

router = APIRouter(prefix="/logs", tags=["logs"])


def _heartbeat_level(status: str | None) -> str:
    if status in {"error", "failed", "offline"}:
        return "ERROR"
    if status in {"degraded", "warning"}:
        return "WARNING"
    return "INFO"


@router.get("")
async def list_logs(
    limit: int = Query(default=100, ge=1, le=500),
    _admin=Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Return a merged, recent event stream from heartbeat and deployment activity."""
    heartbeats_result = await session.execute(
        select(Heartbeat).order_by(Heartbeat.timestamp.desc()).limit(limit)
    )
    deployments_result = await session.execute(
        select(Deployment).order_by(Deployment.created_at.desc()).limit(limit)
    )

    events: list[dict] = []

    for hb in heartbeats_result.scalars().all():
        ts = hb.timestamp or datetime.utcnow()
        events.append(
            {
                "timestamp": ts.isoformat(),
                "level": _heartbeat_level(hb.status),
                "message": f"Heartbeat from {hb.device_id} (status={hb.status or 'unknown'}, cpu={hb.cpu_pct}, mem_mb={hb.memory_mb})",
                "_sort": ts,
            }
        )

    for dep in deployments_result.scalars().all():
        ts = dep.completed_at or dep.created_at or datetime.utcnow()
        level = "ERROR" if dep.status == "failed" else "INFO"
        suffix = f": {dep.error_message}" if dep.error_message else ""
        events.append(
            {
                "timestamp": ts.isoformat(),
                "level": level,
                "message": f"Deployment {dep.id} status={dep.status}{suffix}",
                "_sort": ts,
            }
        )

    events.sort(key=lambda x: x["_sort"], reverse=True)
    logs = [{k: v for k, v in item.items() if k != "_sort"} for item in events[:limit]]
    return {"logs": logs, "total": len(logs)}
