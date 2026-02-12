export interface Device {
  id: string
  name: string
  status: "online" | "offline" | "degraded"
  bundleVersion: string
  lastSeen: string
  cpuUsage: number
  memoryUsage: number
  location: string
  ipAddress: string
}

export interface Bundle {
  id: string
  version: string
  name: string
  size: string
  uploadedAt: string
  deployedCount: number
  status: "active" | "deprecated" | "testing"
}

export interface Deployment {
  id: string
  bundleVersion: string
  targetDevices: number
  successCount: number
  failedCount: number
  status: "pending" | "in_progress" | "completed" | "failed"
  startedAt: string
  completedAt?: string
}

export interface Metric {
  label: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
}

export interface ChartData {
  date: string
  deployments: number
  success: number
  failed: number
}

export interface SuccessRateData {
  rate: number
  total: number
  success: number
  failed: number
}

// Mock Devices
export const mockDevices: Device[] = [
  {
    id: "dev-001",
    name: "edge-node-prod-01",
    status: "online",
    bundleVersion: "v2.1.4",
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    cpuUsage: 34,
    memoryUsage: 58,
    location: "us-east-1a",
    ipAddress: "10.0.1.42",
  },
  {
    id: "dev-002",
    name: "edge-node-prod-02",
    status: "online",
    bundleVersion: "v2.1.4",
    lastSeen: new Date(Date.now() - 45000).toISOString(),
    cpuUsage: 28,
    memoryUsage: 62,
    location: "us-east-1b",
    ipAddress: "10.0.1.43",
  },
  {
    id: "dev-003",
    name: "edge-node-prod-03",
    status: "degraded",
    bundleVersion: "v2.1.3",
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    cpuUsage: 78,
    memoryUsage: 85,
    location: "us-west-2a",
    ipAddress: "10.0.2.12",
  },
  {
    id: "dev-004",
    name: "edge-node-staging-01",
    status: "online",
    bundleVersion: "v2.2.0-beta",
    lastSeen: new Date(Date.now() - 30000).toISOString(),
    cpuUsage: 12,
    memoryUsage: 42,
    location: "us-west-2b",
    ipAddress: "10.0.2.13",
  },
  {
    id: "dev-005",
    name: "edge-node-dev-01",
    status: "offline",
    bundleVersion: "v2.1.2",
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    cpuUsage: 0,
    memoryUsage: 0,
    location: "eu-west-1a",
    ipAddress: "10.0.3.8",
  },
]

// Mock Bundles
export const mockBundles: Bundle[] = [
  {
    id: "bundle-001",
    version: "v2.2.0-beta",
    name: "qwen-2.5b-instruct",
    size: "4.8 GB",
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    deployedCount: 1,
    status: "testing",
  },
  {
    id: "bundle-002",
    version: "v2.1.4",
    name: "qwen-1.5b-chat",
    size: "3.2 GB",
    uploadedAt: new Date(Date.now() - 172800000).toISOString(),
    deployedCount: 24,
    status: "active",
  },
  {
    id: "bundle-003",
    version: "v2.1.3",
    name: "qwen-1.5b-chat",
    size: "3.2 GB",
    uploadedAt: new Date(Date.now() - 259200000).toISOString(),
    deployedCount: 3,
    status: "deprecated",
  },
]

// Mock Deployments
export const mockDeployments: Deployment[] = [
  {
    id: "deploy-001",
    bundleVersion: "v2.1.4",
    targetDevices: 24,
    successCount: 24,
    failedCount: 0,
    status: "completed",
    startedAt: new Date(Date.now() - 172800000).toISOString(),
    completedAt: new Date(Date.now() - 172000000).toISOString(),
  },
  {
    id: "deploy-002",
    bundleVersion: "v2.2.0-beta",
    targetDevices: 1,
    successCount: 1,
    failedCount: 0,
    status: "completed",
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86300000).toISOString(),
  },
]

// Mock Metrics
export const mockMetrics: Metric[] = [
  {
    label: "Total Devices",
    value: 28,
    change: "+2",
    trend: "up",
  },
  {
    label: "Active Bundles",
    value: 3,
    change: "+1",
    trend: "up",
  },
  {
    label: "Deployments (24h)",
    value: 12,
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

// Mock Chart Data (7 days)
export const mockChartData: ChartData[] = [
  { date: "Jan 11", deployments: 8, success: 8, failed: 0 },
  { date: "Jan 12", deployments: 12, success: 11, failed: 1 },
  { date: "Jan 13", deployments: 6, success: 6, failed: 0 },
  { date: "Jan 14", deployments: 15, success: 14, failed: 1 },
  { date: "Jan 15", deployments: 9, success: 9, failed: 0 },
  { date: "Jan 16", deployments: 11, success: 10, failed: 1 },
  { date: "Jan 17", deployments: 14, success: 14, failed: 0 },
]

// Mock Success Rate Data
export const mockSuccessRate: SuccessRateData = {
  rate: 99.8,
  total: 1248,
  success: 1245,
  failed: 3,
}

// Simulate async data fetching with fallback to mock data
import {
  fetchDevicesFromAPI,
  fetchBundlesFromAPI,
  fetchDeploymentsFromAPI,
  fetchMetricsFromAPI,
  fetchChartDataFromAPI,
  fetchSuccessRateFromAPI,
  checkBackendHealth,
} from "@/lib/api/services"

let backendAvailable: boolean | null = null
let lastHealthCheckAt = 0
const HEALTH_CACHE_MS = 30000
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

// Cache health check result for 30 seconds
async function isBackendHealthy(): Promise<boolean> {
  const now = Date.now()
  if (backendAvailable === null || now - lastHealthCheckAt > HEALTH_CACHE_MS) {
    lastHealthCheckAt = now
    backendAvailable = await checkBackendHealth()
  }
  return backendAvailable
}

export const fetchDevices = async (): Promise<Device[]> => {
  try {
    if (await isBackendHealthy()) {
      return await fetchDevicesFromAPI()
    }
    if (!USE_MOCK_DATA) {
      throw new Error("Backend unavailable and mock mode is disabled")
    }
  } catch (error) {
    if (!USE_MOCK_DATA) {
      throw error
    }
    console.warn("API call failed, falling back to mock data:", error)
  }
  // Fallback to mock data
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDevices), 300)
  })
}

export const fetchBundles = async (): Promise<Bundle[]> => {
  try {
    if (await isBackendHealthy()) {
      return await fetchBundlesFromAPI()
    }
    if (!USE_MOCK_DATA) {
      throw new Error("Backend unavailable and mock mode is disabled")
    }
  } catch (error) {
    if (!USE_MOCK_DATA) {
      throw error
    }
    console.warn("API call failed, falling back to mock data:", error)
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockBundles), 250)
  })
}

export const fetchDeployments = async (): Promise<Deployment[]> => {
  try {
    if (await isBackendHealthy()) {
      return await fetchDeploymentsFromAPI()
    }
    if (!USE_MOCK_DATA) {
      throw new Error("Backend unavailable and mock mode is disabled")
    }
  } catch (error) {
    if (!USE_MOCK_DATA) {
      throw error
    }
    console.warn("API call failed, falling back to mock data:", error)
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDeployments), 280)
  })
}

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    if (await isBackendHealthy()) {
      return await fetchMetricsFromAPI()
    }
    if (!USE_MOCK_DATA) {
      throw new Error("Backend unavailable and mock mode is disabled")
    }
  } catch (error) {
    if (!USE_MOCK_DATA) {
      throw error
    }
    console.warn("API call failed, falling back to mock data:", error)
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockMetrics), 200)
  })
}

export const fetchChartData = async (): Promise<ChartData[]> => {
  try {
    if (await isBackendHealthy()) {
      return await fetchChartDataFromAPI()
    }
    if (!USE_MOCK_DATA) {
      throw new Error("Backend unavailable and mock mode is disabled")
    }
  } catch (error) {
    if (!USE_MOCK_DATA) {
      throw error
    }
    console.warn("API call failed, falling back to mock data:", error)
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockChartData), 220)
  })
}

export const fetchSuccessRate = async (): Promise<SuccessRateData> => {
  try {
    if (await isBackendHealthy()) {
      return await fetchSuccessRateFromAPI()
    }
    if (!USE_MOCK_DATA) {
      throw new Error("Backend unavailable and mock mode is disabled")
    }
  } catch (error) {
    if (!USE_MOCK_DATA) {
      throw error
    }
    console.warn("API call failed, falling back to mock data:", error)
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockSuccessRate), 200)
  })
}
