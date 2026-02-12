import asyncio
import httpx
from pathlib import Path

from kernex.config import get_settings
from kernex.device.identity import ensure_keypair
from kernex.device.config import load_device_config, save_device_config
from kernex.device.info import collect_device_info
from kernex.polling.heartbeat import build_heartbeat_payload
from kernex.agent.launcher import run_script
from kernex.agent.bundle_handler import (
    download_bundle,
    extract_bundle,
    load_manifest,
    validate_manifest,
)


async def register_device() -> None:
    settings = get_settings()
    config_path = Path(settings.config_path)
    cached_device_id, cached_token = load_device_config(config_path)
    if cached_device_id:
        settings.device_id = cached_device_id
        return

    _, public_key = ensure_keypair(Path(settings.key_path))
    payload = {
        "public_key": public_key,
        "device_type": "python_sim",
        "hardware_metadata": collect_device_info(),
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f"{settings.control_plane_url}/devices/register", json=payload)
        resp.raise_for_status()
        data = resp.json()
        print(f"Registered device_id={data['device_id']}")
        settings.device_id = data["device_id"]
        save_device_config(config_path, data["device_id"], data["registration_token"])


async def execute_command(command: dict, client: httpx.AsyncClient) -> None:
    """Execute a command received from the control plane."""
    cmd_type = command.get("type")
    if cmd_type == "deploy":
        deployment_id = command.get("deployment_id")
        bundle_id = command.get("bundle_id")
        bundle_version = command.get("bundle_version")
        
        print(f"[COMMAND] Deploying bundle {bundle_version} (deployment_id={deployment_id})")
        
        settings = get_settings()
        bundle_dir = Path.home() / ".kernex" / "bundles"
        
        try:
            # Step 1: Download bundle
            print(f"[DEPLOY] Downloading bundle {bundle_id}...")
            bundle_path = await download_bundle(
                str(settings.control_plane_url),
                bundle_id,
                bundle_dir
            )
            print(f"[DEPLOY] Downloaded to {bundle_path}")
            
            # Step 2: Verify checksum (we need to get it from control plane)
            # For now, we'll verify after extraction by checking manifest
            
            # Step 3: Extract bundle
            print(f"[DEPLOY] Extracting bundle...")
            extracted_dir = await extract_bundle(bundle_path, bundle_dir / bundle_version)
            print(f"[DEPLOY] Extracted to {extracted_dir}")
            
            # Step 4: Load and validate manifest
            print(f"[DEPLOY] Loading manifest...")
            manifest = await load_manifest(extracted_dir)
            await validate_manifest(manifest)
            print(f"[DEPLOY] Manifest validated: version={manifest.get('version')}")
            
            # Step 5: Execute deployment script if specified
            deploy_script = manifest.get("deploy", {}).get("script")
            if deploy_script:
                print(f"[DEPLOY] Running deployment script: {deploy_script}")
                result = await run_script(
                    deploy_script,
                    cwd=extracted_dir,
                    timeout_seconds=300,
                )
                if result.return_code != 0:
                    raise RuntimeError(f"Deploy script failed: {result.stderr}")
                print(f"[DEPLOY] Script output: {result.stdout}")
            
            # Step 6: Report success
            print(f"[DEPLOY] Deployment succeeded; reporting to control plane...")
            result_url = f"{settings.control_plane_url}/deployments/{deployment_id}/result"
            resp = await client.post(
                result_url,
                params={
                    "device_id": settings.device_id,
                    "status_str": "success",
                }
            )
            resp.raise_for_status()
            print(f"[DEPLOY] Success reported to control plane")
            
        except Exception as exc:
            print(f"[DEPLOY] Failed: {exc}")
            # Report failure
            try:
                result_url = f"{settings.control_plane_url}/deployments/{deployment_id}/result"
                resp = await client.post(
                    result_url,
                    params={
                        "device_id": settings.device_id,
                        "status_str": "failed",
                        "error_message": str(exc),
                    }
                )
                resp.raise_for_status()
            except Exception as report_exc:
                print(f"[DEPLOY] Failed to report error: {report_exc}")
    
    elif cmd_type == "rollback":
        deployment_id = command.get("deployment_id")
        bundle_version = command.get("bundle_version")
        
        print(f"[COMMAND] Rolling back to bundle {bundle_version} (deployment_id={deployment_id})")
        
        settings = get_settings()
        bundle_dir = Path.home() / ".kernex" / "bundles"
        
        try:
            # Rollback is same as deploy but for a previous version
            bundle_id = command.get("bundle_id")
            
            print(f"[ROLLBACK] Downloading bundle {bundle_id}...")
            bundle_path = await download_bundle(
                str(settings.control_plane_url),
                bundle_id,
                bundle_dir
            )
            
            print(f"[ROLLBACK] Extracting bundle...")
            extracted_dir = await extract_bundle(bundle_path, bundle_dir / bundle_version)
            
            print(f"[ROLLBACK] Loading manifest...")
            manifest = await load_manifest(extracted_dir)
            await validate_manifest(manifest)
            
            rollback_script = manifest.get("rollback", {}).get("script") or manifest.get("deploy", {}).get("script")
            if rollback_script:
                print(f"[ROLLBACK] Running rollback script: {rollback_script}")
                result = await run_script(
                    rollback_script,
                    cwd=extracted_dir,
                    timeout_seconds=300,
                )
                if result.return_code != 0:
                    raise RuntimeError(f"Rollback script failed: {result.stderr}")
                print(f"[ROLLBACK] Script output: {result.stdout}")
            
            # Report success
            print(f"[ROLLBACK] Rollback succeeded; reporting to control plane...")
            result_url = f"{settings.control_plane_url}/deployments/{deployment_id}/result"
            resp = await client.post(
                result_url,
                params={
                    "device_id": settings.device_id,
                    "status_str": "success",
                }
            )
            resp.raise_for_status()
            print(f"[ROLLBACK] Success reported to control plane")
            
        except Exception as exc:
            print(f"[ROLLBACK] Failed: {exc}")
            try:
                result_url = f"{settings.control_plane_url}/deployments/{deployment_id}/result"
                resp = await client.post(
                    result_url,
                    params={
                        "device_id": settings.device_id,
                        "status_str": "failed",
                        "error_message": str(exc),
                    }
                )
                resp.raise_for_status()
            except Exception as report_exc:
                print(f"[ROLLBACK] Failed to report error: {report_exc}")
    
    elif cmd_type == "configure":
        config_version = command.get("config_version")
        polling_interval = command.get("polling_interval", "60")
        heartbeat_timeout = command.get("heartbeat_timeout", "30")
        deploy_timeout = command.get("deploy_timeout", "300")
        log_level = command.get("log_level", "INFO")
        
        print(f"[COMMAND] Applying configuration (version={config_version})")
        print(f"[CONFIG] polling_interval={polling_interval}s, log_level={log_level}")
        
        settings = get_settings()
        # Update runtime settings
        try:
            settings.polling_interval = int(polling_interval)
            settings.heartbeat_timeout = int(heartbeat_timeout)
            settings.deploy_timeout = int(deploy_timeout)
            settings.log_level = log_level
            print(f"[CONFIG] Configuration applied successfully")
        except Exception as exc:
            print(f"[CONFIG] Failed to apply config: {exc}")
    
    else:
        print(f"[COMMAND] Unknown command type: {cmd_type}")


async def main() -> None:
    await register_device()
    settings = get_settings()
    if not settings.device_id:
        print("No device_id; registration failed")
        return
    async with httpx.AsyncClient(timeout=10.0) as client:
        backoff = 1
        while True:
            try:
                payload = build_heartbeat_payload(agent_version="0.1.0")
                resp = await client.post(
                    f"{settings.control_plane_url}/devices/{settings.device_id}/heartbeat",
                    json=payload,
                )
                resp.raise_for_status()
                commands = resp.json().get("commands", [])
                print(f"Heartbeat sent; received {len(commands)} command(s)")
                for cmd in commands:
                    await execute_command(cmd, client)
                backoff = 1  # reset after success
            except Exception as exc:
                print(f"Heartbeat failed: {exc}; retrying in {backoff}s")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 60)
                continue
            await asyncio.sleep(settings.polling_interval)


if __name__ == "__main__":
    asyncio.run(main())
