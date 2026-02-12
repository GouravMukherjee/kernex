"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  loginUser,
  registerUser,
  fetchDeviceConfigFromAPI,
  updateDeviceConfigFromAPI,
  createRollbackFromAPI,
  fetchDeviceBundleHistoryFromAPI,
  type DeviceConfig,
  type DeviceBundleHistoryItem,
} from "@/lib/api/services"

export default function AdminPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  const [deviceId, setDeviceId] = useState("")
  const [config, setConfig] = useState<DeviceConfig | null>(null)
  const [metadataJson, setMetadataJson] = useState("{}")
  const [configMessage, setConfigMessage] = useState<string | null>(null)

  const [rollbackVersion, setRollbackVersion] = useState("")
  const [rollbackTargetsCsv, setRollbackTargetsCsv] = useState("")
  const [rollbackMessage, setRollbackMessage] = useState<string | null>(null)

  const [history, setHistory] = useState<DeviceBundleHistoryItem[]>([])
  const [historyMessage, setHistoryMessage] = useState<string | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const handleRegister = async () => {
    setAuthMessage(null)
    try {
      await registerUser(username.trim(), email.trim(), password)
      setAuthMessage("User registered. You can log in now.")
    } catch (e) {
      setAuthMessage(`Register failed: ${(e as Error)?.message || "unknown error"}`)
    }
  }

  const handleLogin = async () => {
    setAuthMessage(null)
    try {
      const res = await loginUser(username.trim(), password)
      localStorage.setItem("auth_token", res.access_token)
      setAuthMessage("Login successful. Token saved in localStorage.")
    } catch (e) {
      setAuthMessage(`Login failed: ${(e as Error)?.message || "unknown error"}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    setAuthMessage("Logged out.")
  }

  const handleLoadConfig = async () => {
    setConfigMessage(null)
    try {
      const cfg = await fetchDeviceConfigFromAPI(deviceId.trim())
      setConfig(cfg)
      setMetadataJson(JSON.stringify(cfg.metadata_json || {}, null, 2))
      setConfigMessage(`Loaded config version ${cfg.version}`)
    } catch (e) {
      setConfigMessage(`Load failed: ${(e as Error)?.message || "unknown error"}`)
    }
  }

  const handleSaveConfig = async () => {
    if (!config) {
      setConfigMessage("Load config first.")
      return
    }
    setConfigMessage(null)
    try {
      let metadata: Record<string, unknown> = {}
      try {
        metadata = JSON.parse(metadataJson || "{}")
      } catch {
        setConfigMessage("Metadata must be valid JSON.")
        return
      }

      const updated = await updateDeviceConfigFromAPI(deviceId.trim(), {
        polling_interval: config.polling_interval,
        heartbeat_timeout: config.heartbeat_timeout,
        deploy_timeout: config.deploy_timeout,
        log_level: config.log_level,
        metadata_json: metadata,
      })
      setConfig(updated)
      setConfigMessage(`Config updated to version ${updated.version}`)
    } catch (e) {
      setConfigMessage(`Save failed: ${(e as Error)?.message || "unknown error"}`)
    }
  }

  const handleLoadHistory = async () => {
    setHistoryMessage(null)
    try {
      const rows = await fetchDeviceBundleHistoryFromAPI(deviceId.trim(), 20)
      setHistory(rows)
      setHistoryMessage(`Loaded ${rows.length} history item(s).`)
    } catch (e) {
      setHistoryMessage(`History failed: ${(e as Error)?.message || "unknown error"}`)
    }
  }

  const handleCreateRollback = async () => {
    setRollbackMessage(null)
    try {
      const targets = rollbackTargetsCsv
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
      if (!rollbackVersion.trim() || targets.length === 0) {
        setRollbackMessage("Rollback version and target devices are required.")
        return
      }
      const res = await createRollbackFromAPI(rollbackVersion.trim(), targets)
      setRollbackMessage(`Rollback deployment created: ${res.deployment_id}`)
    } catch (e) {
      setRollbackMessage(`Rollback failed: ${(e as Error)?.message || "unknown error"}`)
    }
  }

  return (
    <div className="p-6 grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-text">Admin Settings</h1>
        <p className="text-sm text-text-muted mt-1">Authentication and control-plane feature operations</p>
      </div>

      <Card className="p-4 grid gap-3">
        <h3 className="text-sm font-semibold text-text">Auth</h3>
        <div className="grid grid-cols-3 gap-2">
          <input
            className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRegister}>Register</Button>
          <Button onClick={handleLogin}>Login</Button>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        <p className="text-xs text-text-dim">Token present: {token ? "yes" : "no"}</p>
        {authMessage && <p className="text-xs text-text-muted">{authMessage}</p>}
      </Card>

      <Card className="p-4 grid gap-3">
        <h3 className="text-sm font-semibold text-text">Device Config & History</h3>
        <div className="flex gap-2">
          <input
            className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm flex-1"
            placeholder="Device ID"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          />
          <Button onClick={handleLoadConfig}>Load Config</Button>
          <Button variant="outline" onClick={handleLoadHistory}>Load History</Button>
        </div>

        {config && (
          <div className="grid gap-2">
            <div className="grid grid-cols-4 gap-2">
              <input className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm" value={config.polling_interval} onChange={(e) => setConfig({ ...config, polling_interval: e.target.value })} />
              <input className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm" value={config.heartbeat_timeout} onChange={(e) => setConfig({ ...config, heartbeat_timeout: e.target.value })} />
              <input className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm" value={config.deploy_timeout} onChange={(e) => setConfig({ ...config, deploy_timeout: e.target.value })} />
              <input className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm" value={config.log_level} onChange={(e) => setConfig({ ...config, log_level: e.target.value })} />
            </div>
            <textarea
              className="w-full min-h-28 rounded-md border border-border bg-surface-2 p-3 text-xs font-mono"
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
            />
            <Button onClick={handleSaveConfig}>Save Config</Button>
          </div>
        )}

        {configMessage && <p className="text-xs text-text-muted">{configMessage}</p>}

        {history.length > 0 && (
          <div className="grid gap-1">
            {history.map((h) => (
              <div key={h.id} className="text-xs text-text-dim border border-border rounded-md px-3 py-2">
                {h.bundle_version} | {h.status} | {new Date(h.deployed_at).toLocaleString()}
              </div>
            ))}
          </div>
        )}
        {historyMessage && <p className="text-xs text-text-muted">{historyMessage}</p>}
      </Card>

      <Card className="p-4 grid gap-3">
        <h3 className="text-sm font-semibold text-text">Rollback</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
            placeholder="Bundle version (e.g. v2.1.4)"
            value={rollbackVersion}
            onChange={(e) => setRollbackVersion(e.target.value)}
          />
          <input
            className="h-9 rounded-md border border-border bg-surface-2 px-3 text-sm"
            placeholder="Target device IDs (comma-separated)"
            value={rollbackTargetsCsv}
            onChange={(e) => setRollbackTargetsCsv(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateRollback}>Create Rollback Deployment</Button>
        {rollbackMessage && <p className="text-xs text-text-muted">{rollbackMessage}</p>}
      </Card>
    </div>
  )
}
