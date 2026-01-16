import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { Deployment, ApiResponse } from '../types';
import { toast } from 'sonner';

/**
 * Fetch all deployments
 */
const fetchDeployments = async (): Promise<Deployment[]> => {
  const response = await apiClient.get<ApiResponse<{ deployments: Deployment[] }>>('/deployments');
  return response.data.data.deployments;
};

/**
 * Fetch single deployment
 */
const fetchDeploymentById = async (deploymentId: string): Promise<Deployment> => {
  const response = await apiClient.get<ApiResponse<Deployment>>(`/deployments/${deploymentId}`);
  return response.data.data;
};

/**
 * Create deployment
 */
const createDeployment = async (data: {
  bundleId: string;
  bundleVersion: string;
  targetDeviceIds: string[];
  scheduledAt?: string;
  canaryPercentage?: number;
}): Promise<Deployment> => {
  const response = await apiClient.post<ApiResponse<Deployment>>('/deployments', data);
  return response.data.data;
};

/**
 * Rollback deployment
 */
const rollbackDeployment = async (deploymentId: string, targetVersion: string): Promise<Deployment> => {
  const response = await apiClient.post<ApiResponse<Deployment>>(`/deployments/${deploymentId}/rollback`, {
    target_version: targetVersion,
  });
  return response.data.data;
};

/**
 * Hook to fetch all deployments
 */
export function useDeployments() {
  return useQuery({
    queryKey: ['deployments'],
    queryFn: fetchDeployments,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch single deployment
 */
export function useDeployment(deploymentId: string | undefined) {
  return useQuery({
    queryKey: ['deployment', deploymentId],
    queryFn: () => fetchDeploymentById(deploymentId!),
    enabled: !!deploymentId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to create deployment
 */
export function useCreateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      bundleId: string;
      bundleVersion: string;
      targetDeviceIds: string[];
      scheduledAt?: string;
      canaryPercentage?: number;
    }) => createDeployment(data),
    onSuccess: () => {
      toast.success('Deployment created successfully');
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: () => {
      toast.error('Failed to create deployment');
    },
  });
}

/**
 * Hook to rollback deployment
 */
export function useRollbackDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deploymentId, targetVersion }: { deploymentId: string; targetVersion: string }) =>
      rollbackDeployment(deploymentId, targetVersion),
    onSuccess: () => {
      toast.success('Deployment rollback initiated');
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: () => {
      toast.error('Failed to rollback deployment');
    },
  });
}
