# Kernex Control Plane API (v1)

Base URL: `/api/v1`

Auth:
- Devices: `X-Device-ID` header + `X-Device-Signature` (RSA sign of request body); HTTPS required.
- Users: `Authorization: Bearer <JWT>`.

Conventions:
- JSON everywhere; UTF-8; timestamps ISO-8601 UTC.
- Idempotency for mutating POSTs via `Idempotency-Key`.
- Rate limits: devices 100 req/min, users 1000 req/min, bundle uploads 10/min.
- Errors: `{"error": {"code": "string", "message": "string"}}` with standard HTTP status codes.

## Devices

### POST /devices/register
Register device with public key and metadata.
Request:
```json
{
  "public_key": "-----BEGIN RSA PUBLIC KEY-----\n...",
  "device_type": "raspberry_pi",
  "hardware_metadata": { "ram_gb": 8, "cpu_cores": 4, "storage_gb": 32, "os": "Raspberry Pi OS" }
}
```
Response 201:
```json
{ "device_id": "device-uuid", "registration_token": "token" }
```

### GET /devices
List devices (paginated).
Query: `limit`, `offset`.
Response 200:
```json
{ "devices": [...], "total": 150 }
```

### GET /devices/{device_id}
Fetch device details (last heartbeat, current bundle, status).

### POST /devices/{device_id}/heartbeat
Device heartbeat + command poll (idempotent).
Headers: device auth.
Request:
```json
{ "agent_version": "0.1.0", "memory_mb": 512, "cpu_pct": 23.1, "status": "healthy" }
```
Response 200:
```json
{ "commands": [ { "type": "deploy", "deployment_id": "uuid", "bundle_version": "v0.2" } ] }
```

## Bundles

### POST /bundles
Multipart upload of bundle tarball + manifest.
Form fields:
- `file`: tar.gz (bundle)
- `manifest`: JSON string
Response 201:
```json
{ "bundle_id": "uuid", "version": "v0.2", "checksum_sha256": "abc123" }
```

### GET /bundles
List bundles (paginated).

### GET /bundles/{bundle_id}
Stream bundle download (supports Range).

### POST /bundles/{bundle_id}/verify
Verify checksum.
Request:
```json
{ "checksum_sha256": "abc123" }
```
Response 200:
```json
{ "valid": true }
```

## Deployments

### POST /deployments
Create deployment targeting devices/groups.
Request:
```json
{
  "bundle_version": "v0.2",
  "target_devices": ["device-001", "device-002"],
  "description": "Night lighting improvements"
}
```
Response 201:
```json
{ "deployment_id": "uuid", "status": "pending" }
```

### GET /deployments
List deployments (paginated).

### GET /deployments/{deployment_id}
Deployment detail + target devices + progress.

### POST /deployments/{deployment_id}/rollback
Request rollback to target version.
Request:
```json
{ "target_version": "v0.1" }
```
Response 202:
```json
{ "deployment_id": "uuid", "status": "pending" }
```

### POST /deployments/{deployment_id}/result
Devices report deployment outcome.
Request:
```json
{ "device_id": "device-001", "status": "success", "error_message": null }
```

## Logs

### POST /logs/batch
Batch ingest device logs.
Request:
```json
[
  { "device_id": "device-001", "level": "info", "message": "Heartbeat sent", "timestamp": "2025-12-27T10:00:00Z" }
]
```
Response 200:
```json
{ "ingested": 1 }
```

### GET /devices/{device_id}/logs
Paginated logs with optional filter `level`.
Query: `limit`, `offset`, `level`.
Response:
```json
{ "logs": [...], "total": 500 }
```

## Auth & Security Notes
- All endpoints over TLS 1.3; devices pin CA.
- Device requests: `X-Device-Signature` = RSA4096 sign of body; control plane verifies with stored public key.
- User JWT expires in 24h; roles: admin, ops, read_only (RBAC in v1).
- Idempotency keys required for POSTs that can be retried by devices.

## Status Codes
- 200 OK, 201 Created, 202 Accepted
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict
- 429 Too Many Requests, 500 Internal Server Error
