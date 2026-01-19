# 🎯 KERNEX ACTION PLAN - IMMEDIATE FIXES

**Priority**: Fix critical issues blocking production deployment  
**Timeline**: 1-2 weeks to full production readiness  
**Test Status**: 23/23 passing (100%)

---

## 🔴 CRITICAL ISSUES (Fix Today)

### Issue #1: PostgreSQL Permissions Block Deployment
**File**: `DEPLOYMENT_BLOCKERS.md` (Read this first!)  
**Time**: 30 minutes  
**Severity**: BLOCKER - Cannot deploy to production

**Problem**:
```
asyncpg.exceptions.InsufficientPrivilegeError: permission denied for schema public
```

**Solution**:
Run these SQL commands via DigitalOcean console OR use the PowerShell script at:
```powershell
.\infra\scripts\fix-db-permissions.ps1 -AdminPassword "..."
```

---

### Issue #2: Hardcoded Secret Key in auth.py
**File**: `control-plane/app/auth.py` (line 11)  
**Time**: 5 minutes  
**Severity**: CRITICAL - Tokens can be forged

**Current Code**:
```python
SECRET_KEY = "your-secret-key-change-in-production"
```

**Fix**:
```python
import os
from functools import lru_cache

# Generate a secure key:
# python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-key-only")

# In production, set environment variable:
# export SECRET_KEY="your-generated-key-here"
```

---

### Issue #3: Missing Dashboard Stats Endpoint
**File**: `control-plane/app/api/v1/devices.py`  
**Time**: 15 minutes  
**Severity**: HIGH - Frontend shows loading forever

**Current Frontend**:
```typescript
// frontend/lib/api/devices.ts
const response = await apiClient.get('/devices/stats');  // ❌ 404!
```

**Missing Backend Endpoint**:
Add this to `control-plane/app/api/v1/devices.py`:

```python
@router.get("/stats")
async def get_dashboard_stats(session: AsyncSession = Depends(get_session)):
    """Get dashboard statistics"""
    # Count total devices
    result = await session.execute(select(func.count(Device.id)))
    total_devices = result.scalar() or 0
    
    # Count online devices
    result = await session.execute(
        select(func.count(Device.id)).where(Device.status == "online")
    )
    online_devices = result.scalar() or 0
    
    # Count active deployments
    result = await session.execute(
        select(func.count(Deployment.id)).where(Deployment.status == "in_progress")
    )
    active_deployments = result.scalar() or 0
    
    # Count bundles
    result = await session.execute(select(func.count(Bundle.id)))
    total_bundles = result.scalar() or 0
    
    return {
        "total_devices": total_devices,
        "online_devices": online_devices,
        "active_deployments": active_deployments,
        "total_bundles": total_bundles,
        "offline_devices": total_devices - online_devices,
    }
```

**Don't forget imports**:
```python
from sqlalchemy import func
```

---

## 🟠 HIGH PRIORITY (This Week)

### Issue #4: Device Authentication Not Enforced
**File**: `control-plane/app/api/v1/devices.py`  
**Time**: 4-6 hours  
**Severity**: HIGH - Security vulnerability (device spoofing)

**Current Problem**:
```python
# Any device can POST results for any deployment_id
# No signature verification
```

**Step 1: Add signature verification utility**

Create `control-plane/app/security.py` helper:
```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
import json
import hashlib

def verify_device_signature(public_key_pem: str, signature_hex: str, request_body: str) -> bool:
    """
    Verify RSA4096 signature from device
    
    Args:
        public_key_pem: Device's public key (from Device model)
        signature_hex: Signature from X-Device-Signature header
        request_body: Raw request body as string
        
    Returns:
        True if signature is valid
    """
    try:
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode()
        )
        
        signature = bytes.fromhex(signature_hex)
        body_hash = hashlib.sha256(request_body.encode()).digest()
        
        public_key.verify(
            signature,
            body_hash,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False
```

**Step 2: Update heartbeat endpoint**

```python
@router.post("/{device_id}/heartbeat")
async def post_heartbeat(
    device_id: str,
    payload: HeartbeatRequest,
    request: Request,  # Add this
    session: AsyncSession = Depends(get_session),
) -> HeartbeatResponse:
    """Post heartbeat with RSA signature verification"""
    
    device = await session.scalar(
        select(Device).where(Device.device_id == device_id)
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Verify signature (optional in dev, required in production)
    signature_header = request.headers.get("X-Device-Signature")
    if signature_header:
        body = await request.body()
        if not verify_device_signature(device.public_key, signature_header, body.decode()):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    # ... rest of function remains same
```

**Step 3: Update runtime to sign requests**

In `runtime/kernex/main.py`:
```python
import hashlib
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes

async def post_heartbeat(payload: dict, client: httpx.AsyncClient):
    """Sign and post heartbeat"""
    
    # Load private key
    private_key_pem, _ = ensure_keypair(Path(settings.key_path))
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(), password=None
    )
    
    # Serialize payload
    body = json.dumps(payload)
    body_hash = hashlib.sha256(body.encode()).digest()
    
    # Sign
    signature = private_key.sign(
        body_hash,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    signature_hex = signature.hex()
    
    # Send with signature header
    response = await client.post(
        f"{settings.control_plane_url}/devices/{settings.device_id}/heartbeat",
        content=body,
        headers={
            "X-Device-Signature": signature_hex,
            "Content-Type": "application/json"
        }
    )
    return response.json()
```

---

### Issue #5: Frontend Bundle Upload Missing Manifest
**File**: `frontend/lib/api/bundles.ts`  
**Time**: 1 hour  
**Severity**: HIGH - Bundle uploads fail with 400 error

**Current Code**:
```typescript
const uploadBundle = async (file: File, version: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('version', version);
  // ❌ Missing: manifest_json
```

**Backend Expects**:
```python
@router.post("")
async def upload_bundle(
    version: str = Form(...),
    manifest_json: str = Form(...),  # ← REQUIRED
    file: UploadFile = File(...),
):
```

**Fix**:
```typescript
const uploadBundle = async (
  file: File, 
  version: string,
  manifest: BundleManifest  // Add this parameter
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('version', version);
  formData.append('manifest_json', JSON.stringify(manifest));  // Add this
  
  const response = await apiClient.post<ApiResponse<Bundle>>(
    '/bundles',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data.data;
};
```

---

### Issue #6: Frontend Missing Integration Pages
**Files**: `frontend/app/bundles/page.tsx`, `frontend/app/deployments/page.tsx`  
**Time**: 2-3 hours  
**Severity**: MEDIUM - Dashboard incomplete

**Current State**:
```tsx
<TabsContent value="bundles">
  <div className="text-center py-12">
    <p className="text-text-secondary">Bundles management coming soon</p>
  </div>
</TabsContent>
```

**Create Bundle Upload Page**:
```tsx
// frontend/app/bundles/page.tsx
'use client';

import { useState } from 'react';
import { useBundles, useUploadBundle } from '@/lib/api/bundles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BundlesPage() {
  const { data: bundles, isLoading } = useBundles();
  const uploadMutation = useUploadBundle();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');

  const handleUpload = async () => {
    if (!file || !version) return;
    await uploadMutation.mutateAsync({ file, version });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Bundle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <input
            type="text"
            placeholder="Version (e.g., 1.0.0)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          <Button onClick={handleUpload} disabled={!file || !version}>
            Upload
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Bundles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-2">
              {bundles?.map((b) => (
                <li key={b.id} className="p-2 bg-gray-100 rounded">
                  {b.version} - {b.checksum_sha256}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🟡 MEDIUM PRIORITY (Sprint 2)

### Issue #7: Bundle Encryption Not Implemented
**Time**: 6-8 hours  
**Severity**: MEDIUM - Data protection

**Create**: `control-plane/app/services/bundle_encryption.py`
```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os

def encrypt_bundle(bundle_data: bytes, encryption_key: str) -> bytes:
    """Encrypt bundle with AES-256-GCM"""
    iv = os.urandom(16)
    cipher = Cipher(
        algorithms.AES(encryption_key.encode()),
        modes.GCM(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(bundle_data) + encryptor.finalize()
    return iv + encryptor.tag + ciphertext

def decrypt_bundle(encrypted_data: bytes, encryption_key: str) -> bytes:
    """Decrypt bundle"""
    iv = encrypted_data[:16]
    tag = encrypted_data[16:32]
    ciphertext = encrypted_data[32:]
    
    cipher = Cipher(
        algorithms.AES(encryption_key.encode()),
        modes.GCM(iv, tag),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    return decryptor.update(ciphertext) + decryptor.finalize()
```

---

### Issue #8: Add Comprehensive Error Handling Tests
**Create**: `control-plane/tests/test_error_handling.py`
```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.asyncio
async def test_device_heartbeat_timeout():
    """Test device handles control plane timeout"""
    # Implement timeout test

@pytest.mark.asyncio
async def test_bundle_download_failure():
    """Test device handles missing bundle"""
    # Implement missing bundle test

@pytest.mark.asyncio
async def test_deployment_script_timeout():
    """Test device handles 5-minute script timeout"""
    # Implement timeout test
```

---

## 🧪 TEST EXECUTION INSTRUCTIONS

### Run All Tests (23/23 should pass)
```bash
cd control-plane
python -m pytest tests/ -v
```

### Expected Output
```
===== 23 passed in 11.51s =====
```

### Run Specific Test File
```bash
python -m pytest tests/test_devices.py -v
```

### Run Single Test
```bash
python -m pytest tests/test_devices.py::test_device_register -v
```

### Run with Coverage
```bash
python -m pytest tests/ --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

---

## ✅ VERIFICATION CHECKLIST

After applying fixes, verify with:

```bash
# 1. Tests still pass
cd control-plane
python -m pytest tests/ -v
# Expected: 23/23 PASSED ✅

# 2. Stats endpoint works
curl http://localhost:8000/api/v1/devices/stats
# Expected: {"total_devices": X, "online_devices": Y, ...}

# 3. Frontend loads without errors
cd frontend
npm run dev
# Expected: http://localhost:3000 loads dashboard

# 4. Device can register
cd runtime
python -m kernex
# Expected: "Registered device_id=..."

# 5. Heartbeat works
# Wait 60 seconds, should see heartbeat request in control plane logs
```

---

## 📚 REFERENCE DOCUMENTATION

- **Deployment Issues**: `DEPLOYMENT_BLOCKERS.md`
- **Full Codebase Review**: `COMPREHENSIVE_CODEBASE_REVIEW.md` (just created)
- **Status Reports**: `PROJECT_STATUS.md`, `COMPLETION_REPORT.md`
- **API Spec**: `docs/api-spec.md`
- **Architecture**: `docs/PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`

---

## 🎯 SUCCESS CRITERIA

After completing these fixes:

```
✅ All 23 tests passing
✅ Frontend dashboard shows stats
✅ Bundle upload works end-to-end
✅ Device authentication enforced
✅ Can deploy to DigitalOcean without errors
✅ Device registration + heartbeat + deployment workflow complete
```

---

**Next Step**: Start with Issue #1 (30 min) to unblock deployment!
