import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { Bundle, BundleManifest, ApiResponse } from '../types';
import { toast } from 'sonner';

/**
 * Fetch all bundles
 */
const fetchBundles = async (): Promise<Bundle[]> => {
  const response = await apiClient.get<ApiResponse<{ bundles: Bundle[] }>>('/bundles');
  return response.data.data.bundles;
};

/**
 * Upload a new bundle
 */
const uploadBundle = async (
  file: File,
  manifest: BundleManifest,
  onProgress?: (progress: number) => void
): Promise<Bundle> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('manifest', JSON.stringify(manifest));

  const response = await apiClient.post<ApiResponse<Bundle>>('/bundles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const progress = Math.round((progressEvent.loaded / (progressEvent.total ?? 1)) * 100);
      onProgress?.(progress);
    },
  });

  return response.data.data;
};

/**
 * Verify bundle checksum
 */
const verifyBundle = async (bundleId: string, checksumSha256: string): Promise<boolean> => {
  const response = await apiClient.post<ApiResponse<{ valid: boolean }>>(`/bundles/${bundleId}/verify`, {
    checksum_sha256: checksumSha256,
  });
  return response.data.data.valid;
};

/**
 * Hook to fetch all bundles
 */
export function useBundles() {
  return useQuery({
    queryKey: ['bundles'],
    queryFn: fetchBundles,
    staleTime: 60 * 1000, // 60 seconds
  });
}

/**
 * Hook to upload a bundle
 */
export function useUploadBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, manifest, onProgress }: { file: File; manifest: BundleManifest; onProgress?: (progress: number) => void }) =>
      uploadBundle(file, manifest, onProgress),
    onSuccess: () => {
      toast.success('Bundle uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: () => {
      toast.error('Failed to upload bundle');
    },
  });
}

/**
 * Hook to verify bundle
 */
export function useVerifyBundle() {
  return useMutation({
    mutationFn: ({ bundleId, checksumSha256 }: { bundleId: string; checksumSha256: string }) =>
      verifyBundle(bundleId, checksumSha256),
    onError: () => {
      toast.error('Bundle verification failed');
    },
  });
}
