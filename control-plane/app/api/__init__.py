from fastapi import APIRouter
from app.api.v1 import devices, bundles, deployments, device_config, auth, logs

api_router = APIRouter()
api_router.include_router(devices.router)
api_router.include_router(bundles.router)
api_router.include_router(deployments.router)
api_router.include_router(device_config.router)
api_router.include_router(auth.router)
api_router.include_router(logs.router)
