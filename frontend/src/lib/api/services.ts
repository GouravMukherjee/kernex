import apiClient from "./client"
import { Device, Bundle, Deployment, SuccessRateData, ChartData, Metric } from "@/lib/data/mock"

export interface LogEntry {
  timestamp: string
  level: "INFO" | "WARNING" | "ERROR"
  message: string
}

export interface AuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface DeviceConfig {
  id: string
  device_id: string
  polling_interval: string
  heartbeat_timeout: string
  deploy_timeout: string
  log_level: string
  metadata_json?: Record<string, unknown> | null
  version: string
  updated_at: string
  created_at: string
}

export interface DeviceBundleHistoryItem {
  id: string
  device_id: string
  bundle_version: string
  bundle_id: string
  deployment_id?: string | null
  status: string
  error_message?: string | null
  deployed_at: string
  duration_seconds?: string | null
}

export interface RollbackResponse {
  deployment_id: string
  status: string
  target_device_ids: string[]
  bundle_version: string
}

function mapDeploymentStatus(status: string): "pending" | "in_progress" | "completed" | "failed" {
  if (status === "success" || status === "completed") return "completed"
  if (status === "failed") return "failed"
  if (status === "in_progress") return "in_progress"
  return "pending"
}

/**
 * DEVICES API
 */
export async function fetchDevicesFromAPI(): Promise<Device[]> {
  try {
    const response = await apiClient.get("/devices")
    return response.data.devices.map((d: any) => ({
      id: d.device_id,
      name: d.device_id.split("-").slice(0, 2).join("-"),
      status: d.status === "online" ? "online" : d.status === "offline" ? "offline" : "degraded",
      bundleVersion: d.current_bundle_version || "unknown",
      lastSeen: d.last_heartbeat || new Date().toISOString(),
      cpuUsage: d.hardware_metadata?.cpu_percent || 0,
      memoryUsage: d.hardware_metadata?.memory_percent || 0,
      location: d.hardware_metadata?.region || "unknown",
      ipAddress: d.hardware_metadata?.ip_address || "0.0.0.0",
    }))
  } catch (error) {
    console.error("Failed to fetch devices from API:", error)
    throw error
  }
}

export async function getDeviceDetail(deviceId: string): Promise<Device> {
  try {
    const response = await apiClient.get(`/devices/${deviceId}`)
    const d = response.data
    return {
      id: d.device_id,
      name: d.device_id.split("-").slice(0, 2).join("-"),
      status: d.status === "online" ? "online" : d.status === "offline" ? "offline" : "degraded",
      bundleVersion: d.current_bundle_version || "unknown",
      lastSeen: d.last_heartbeat || new Date().toISOString(),
      cpuUsage: d.hardware_metadata?.cpu_percent || 0,
      memoryUsage: d.hardware_metadata?.memory_percent || 0,
      location: d.hardware_metadata?.region || "unknown",
      ipAddress: d.hardware_metadata?.ip_address || "0.0.0.0",
    }
  } catch (error) {
    console.error(`Failed to fetch device ${deviceId}:`, error)
    throw error
  }
}

/**
 * BUNDLES API
 */
export async function fetchBundlesFromAPI(): Promise<Bundle[]> {
  try {
    const response = await apiClient.get("/bundles")
    return response.data.bundles.map((b: any) => ({
      id: b.id,
      version: b.version,
      name: b.manifest?.name || b.version,
      size: b.manifest?.size || "unknown",
      uploadedAt: b.created_at || new Date().toISOString(),
      deployedCount: b.deployment_count || 0,
      status: b.manifest?.status || "active",
    }))
  } catch (error) {
    console.error("Failed to fetch bundles from API:", error)
    throw error
  }
}

/**
 * DEPLOYMENTS API
 */
export async function fetchDeploymentsFromAPI(): Promise<Deployment[]> {
  try {
    const response = await apiClient.get("/deployments")
    return response.data.deployments.map((d: any) => ({
      id: d.id,
      bundleVersion: d.bundle_version,
      targetDevices: d.target_devices?.length || 0,
      successCount: d.target_devices?.filter((t: any) => t.status === "success")?.length || 0,
      failedCount: d.target_devices?.filter((t: any) => t.status === "failed")?.length || 0,
      status: mapDeploymentStatus(d.status),
      startedAt: d.created_at || new Date().toISOString(),
      completedAt: d.completed_at,
    }))
  } catch (error) {
    console.error("Failed to fetch deployments from API:", error)
    throw error
  }
}

export async function createDeployment(bundleVersion: string, targetDevices: string[]): Promise<string> {
  try {
    const response = await apiClient.post("/deployments", {
      bundle_version: bundleVersion,
      target_devices: targetDevices,
    })
    return response.data.deployment_id
  } catch (error) {
    console.error("Failed to create deployment:", error)
    throw error
  }
}

/**
 * METRICS & ANALYTICS
 */
export async function fetchMetricsFromAPI(): Promise<Metric[]> {
  try {
    const devicesResponse = await apiClient.get("/devices")
    const bundlesResponse = await apiClient.get("/bundles")
    const deploymentsResponse = await apiClient.get("/deployments")

    const devices = devicesResponse.data.devices || []
    const bundles = bundlesResponse.data.bundles || []
    const deployments = deploymentsResponse.data.deployments || []

    const onlineCount = devices.filter((d: any) => d.status === "online").length
    const totalDevices = devices.length

    return [
      {
        label: "Total Devices",
        value: totalDevices,
        change: `+${onlineCount}`,
        trend: "up",
      },
      {
        label: "Active Bundles",
        value: bundles.length,
        change: bundles.length > 0 ? "+1" : "0",
        trend: "up",
      },
      {
        label: "Deployments (24h)",
        value: deployments.filter((d: any) => {
          const createdAt = new Date(d.created_at)
          const now = new Date()
          return now.getTime() - createdAt.getTime() < 86400000
        }).length,
        change: "-3",
        trend: "down",
      },
      {
        label: "Avg Rollback Time",
        value: "2.4s",
        change: "-0.3s",
        trend: "up",
      },
    ]
  } catch (error) {
    console.error("Failed to fetch metrics:", error)
    throw error
  }
}

export async function fetchChartDataFromAPI(): Promise<ChartData[]> {
  try {
    const response = await apiClient.get("/deployments")
    const deployments = response.data.deployments || []

    // Group deployments by day
    const chartDataMap: { [key: string]: ChartData } = {}

    deployments.forEach((d: any) => {
      const date = new Date(d.created_at)
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

      if (!chartDataMap[dateStr]) {
        chartDataMap[dateStr] = {
          date: dateStr,
          deployments: 0,
          success: 0,
          failed: 0,
        }
      }

      chartDataMap[dateStr].deployments++
      if (d.status === "completed") {
        chartDataMap[dateStr].success++
      } else if (d.status === "failed") {
        chartDataMap[dateStr].failed++
      }
    })

    return Object.values(chartDataMap).slice(-7)
  } catch (error) {
    console.error("Failed to fetch chart data:", error)
    throw error
  }
}

export async function fetchSuccessRateFromAPI(): Promise<SuccessRateData> {
  try {
    const response = await apiClient.get("/deployments")
    const deployments = response.data.deployments || []

    const total = deployments.length
    const success = deployments.filter((d: any) => d.status === "completed").length
    const failed = deployments.filter((d: any) => d.status === "failed").length

    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : 0

    return {
      rate: Number(rate),
      total,
      success,
      failed,
    }
  } catch (error) {
    console.error("Failed to fetch success rate:", error)
    throw error
  }
}

/**
 * HEALTH CHECK
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get("/health")
    return response.status === 200
  } catch (error) {
    console.error("Backend health check failed:", error)
    return false
  }
}

export async function uploadBundleToAPI(file: File, manifest: Record<string, unknown>): Promise<string> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("manifest", JSON.stringify(manifest))
    const response = await apiClient.post("/bundles", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.bundle_id
  } catch (error) {
    console.error("Failed to upload bundle:", error)
    throw error
  }
}

export async function registerUser(username: string, email: string, password: string): Promise<void> {
  try {
    await apiClient.post("/auth/register", { username, email, password })
  } catch (error) {
    console.error("Failed to register user:", error)
    throw error
  }
}

export async function loginUser(username: string, password: string): Promise<AuthTokenResponse> {
  try {
    const response = await apiClient.post("/auth/login", { username, password })
    return response.data as AuthTokenResponse
  } catch (error) {
    console.error("Failed to login user:", error)
    throw error
  }
}

export async function fetchDeviceConfigFromAPI(deviceId: string): Promise<DeviceConfig> {
  try {
    const response = await apiClient.get(`/devices/${deviceId}/config`)
    return response.data as DeviceConfig
  } catch (error) {
    console.error("Failed to fetch device config:", error)
    throw error
  }
}

export async function updateDeviceConfigFromAPI(
  deviceId: string,
  payload: {
    polling_interval: string
    heartbeat_timeout: string
    deploy_timeout: string
    log_level: string
    metadata_json?: Record<string, unknown>
  }
): Promise<DeviceConfig> {
  try {
    const response = await apiClient.put(`/devices/${deviceId}/config`, payload)
    return response.data as DeviceConfig
  } catch (error) {
    console.error("Failed to update device config:", error)
    throw error
  }
}

export async function fetchDeviceBundleHistoryFromAPI(
  deviceId: string,
  limit = 20
): Promise<DeviceBundleHistoryItem[]> {
  try {
    const response = await apiClient.get(`/devices/${deviceId}/bundle-history`, {
      params: { limit },
    })
    return response.data as DeviceBundleHistoryItem[]
  } catch (error) {
    console.error("Failed to fetch bundle history:", error)
    throw error
  }
}

export async function createRollbackFromAPI(
  bundleVersion: string,
  targetDeviceIds: string[]
): Promise<RollbackResponse> {
  try {
    const response = await apiClient.post("/devices/rollback", {
      bundle_version: bundleVersion,
      target_device_ids: targetDeviceIds,
    })
    return response.data as RollbackResponse
  } catch (error) {
    console.error("Failed to create rollback:", error)
    throw error
  }
}

export async function fetchLogsFromAPI(limit = 100): Promise<LogEntry[]> {
  try {
    const response = await apiClient.get("/logs", { params: { limit } })
    return (response.data.logs || []).map((l: any) => ({
      timestamp: l.timestamp || new Date().toISOString(),
      level: (l.level || "INFO") as "INFO" | "WARNING" | "ERROR",
      message: l.message || "",
    }))
  } catch (error) {
    console.error("Failed to fetch logs from API:", error)
    throw error
  }
}
