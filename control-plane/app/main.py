import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from prometheus_client import make_asgi_app

from app.api import api_router
from app.config import get_settings
from app.db.session import init_db
from app.security import setup_security_middleware
from app.observability import setup_json_logging

settings = get_settings()

# Setup logging
setup_json_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown (if needed)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

# Setup security middleware
setup_security_middleware(app)

# Mount Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# Health check at API prefix for integration testing
@app.get("/api/v1/health")
async def api_health() -> dict:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.api_prefix)


def start() -> None:
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
