from typing import Any

import httpx


class ControlPlaneClient:
    def __init__(self, base_url: str, timeout_seconds: float = 15.0):
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    async def send_heartbeat(self, device_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.base_url}/devices/{device_id}/heartbeat", json=payload)
            response.raise_for_status()
            return response.json()

    async def report_deployment_result(
        self,
        deployment_id: str,
        device_id: str,
        status_str: str,
        error_message: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"device_id": device_id, "status_str": status_str}
        if error_message:
            params["error_message"] = error_message
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{self.base_url}/deployments/{deployment_id}/result", params=params)
            response.raise_for_status()
            return response.json()
