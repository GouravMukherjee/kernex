import type { Device } from '../types';

export type StatusType = 'online' | 'offline' | 'degraded' | 'error' | 'pending' | 'in_progress' | 'success' | 'failed';

/**
 * Get color class for device status
 */
export function getStatusColorClass(status: StatusType): string {
  const colorMap: Record<StatusType, string> = {
    online: 'bg-status-online text-white',
    offline: 'bg-status-offline text-white',
    degraded: 'bg-status-degraded text-white',
    error: 'bg-status-error text-white',
    pending: 'bg-amber-500 text-white',
    in_progress: 'bg-blue-500 text-white',
    success: 'bg-status-online text-white',
    failed: 'bg-status-error text-white',
  };
  return colorMap[status] || 'bg-text-muted text-white';
}

/**
 * Get status dot class for visual indicator
 */
export function getStatusDotClass(status: StatusType): string {
  const dotMap: Record<StatusType, string> = {
    online: 'status-dot-online',
    offline: 'status-dot-offline',
    degraded: 'status-dot-degraded',
    error: 'status-dot-error',
    pending: 'w-3 h-3 rounded-full bg-amber-500 animate-pulse-subtle',
    in_progress: 'w-3 h-3 rounded-full bg-blue-500 animate-pulse-subtle',
    success: 'status-dot-online',
    failed: 'status-dot-error',
  };
  return dotMap[status] || 'status-dot';
}

/**
 * Get label for status
 */
export function getStatusLabel(status: StatusType): string {
  const labelMap: Record<StatusType, string> = {
    online: 'Online',
    offline: 'Offline',
    degraded: 'Degraded',
    error: 'Error',
    pending: 'Pending',
    in_progress: 'In Progress',
    success: 'Success',
    failed: 'Failed',
  };
  return labelMap[status] || 'Unknown';
}

/**
 * Determine memory bar color based on percentage
 */
export function getMemoryColorClass(percentage: number): string {
  if (percentage > 90) return 'bg-status-error';
  if (percentage > 80) return 'bg-status-degraded';
  return 'bg-status-online';
}

/**
 * Determine CPU bar color based on percentage
 */
export function getCpuColorClass(percentage: number): string {
  if (percentage > 90) return 'bg-status-error';
  if (percentage > 80) return 'bg-status-degraded';
  return 'bg-status-online';
}

/**
 * Check if device is healthy
 */
export function isDeviceHealthy(device: Device): boolean {
  return device.status === 'online' && device.memory.percentage < 90 && device.cpu.percentage < 90;
}

/**
 * Get deployment status icon type
 */
export function getDeploymentIconType(status: string): 'success' | 'error' | 'pending' | 'progress' {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'pending') return 'pending';
  return 'progress';
}
