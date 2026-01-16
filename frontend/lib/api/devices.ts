import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { Device, DashboardStats, ApiResponse } from '../types';

/**
 * Fetch all devices
 */
const fetchDevices = async (): Promise<Device[]> => {
  const response = await apiClient.get<ApiResponse<{ devices: Device[] }>>('/devices');
  return response.data.data.devices;
};

/**
 * Fetch single device by ID
 */
const fetchDeviceById = async (deviceId: string): Promise<Device> => {
  const response = await apiClient.get<ApiResponse<Device>>(`/devices/${deviceId}`);
  return response.data.data;
};

/**
 * Fetch dashboard statistics
 */
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<ApiResponse<DashboardStats>>('/devices/stats');
  return response.data.data;
};

/**
 * Hook to fetch all devices
 */
export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 60 seconds as backup to WebSocket
  });
}

/**
 * Hook to fetch single device
 */
export function useDevice(deviceId: string | undefined) {
  return useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDeviceById(deviceId!),
    enabled: !!deviceId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to update device (mutation)
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deviceId, data }: { deviceId: string; data: Partial<Device> }) => {
      const response = await apiClient.put<ApiResponse<Device>>(`/devices/${deviceId}`, data);
      return response.data.data;
    },
    onSuccess: (device) => {
      queryClient.setQueryData(['device', device.id], device);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
