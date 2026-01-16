/**
 * Type definitions for Device
 */
export interface Device {
  id: string;
  name: string;
  deviceId: string;
  type: 'raspberry_pi' | 'jetson_nano' | 'jetson_orin' | 'x86' | 'other';
  status: 'online' | 'offline' | 'degraded' | 'error';
  currentBundleVersion: string;
  lastHeartbeat: string | Date;
  agentVersion: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    percentage: number;
    cores: number;
  };
  metadata: {
    location?: string;
    tags?: string[];
    architecture?: string;
    osVersion?: string;
  };
}

/**
 * Type definitions for Bundle
 */
export interface Bundle {
  id: string;
  version: string;
  modelName: string;
  fileSize: number;
  checksumSha256: string;
  uploadedAt: string | Date;
  deploymentCount: number;
  status: 'active' | 'archived';
  manifest: BundleManifest;
}

export interface BundleManifest {
  name: string;
  version: string;
  description: string;
  modelPath: string;
  requirements?: string[];
  metadata?: {
    author?: string;
    license?: string;
    tags?: string[];
  };
}

/**
 * Type definitions for Deployment
 */
export interface Deployment {
  id: string;
  bundleId: string;
  bundleVersion: string;
  targetDeviceCount: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back';
  createdAt: string | Date;
  startedAt?: string | Date;
  completedAt?: string | Date;
  rollbackInfo?: {
    targetVersion: string;
    reason?: string;
  };
  deviceStatuses?: DeviceDeploymentStatus[];
}

export interface DeviceDeploymentStatus {
  deviceId: string;
  deviceName: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  startedAt?: string | Date;
  completedAt?: string | Date;
  error?: string;
}

/**
 * API Response types
 */
export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  activeBundles: number;
  latestBundleVersion: string;
  totalDeployments: number;
  successRate: number;
  avgRollbackTime: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
