import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';

export interface WardAdminItem {
  id: string;
  wardNumber: number;
  officeAddress: string | null;
  contactPhone: string | null;
  _count?: {
    serviceZones: number;
    properties: number;
  };
}

export interface ZoneAdminItem {
  id: string;
  wardId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  _count?: {
    properties: number;
  };
}

export interface CreateWardInput {
  wardNumber: number;
  officeAddress?: string;
  contactPhone?: string;
}

export interface CreateZoneInput {
  wardId: string;
  name: string;
  code: string;
  description?: string;
}

// 1. Hook to fetch all wards with zone and property counts
export function useAdminWards() {
  return useQuery<WardAdminItem[]>({
    queryKey: ['admin-wards'],
    queryFn: async () => {
      const response = await apiClient.get<WardAdminItem[]>('/wards');
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// 2. Hook to fetch zones for a specific ward
export function useAdminZones(wardId: string | null) {
  return useQuery<ZoneAdminItem[]>({
    queryKey: ['admin-zones', wardId],
    queryFn: async () => {
      if (!wardId) return [];
      const response = await apiClient.get<ZoneAdminItem[]>(`/wards/${wardId}/zones`);
      return response.data;
    },
    enabled: Boolean(wardId),
    staleTime: 60 * 1000,
  });
}

// 3. Mutation Hook to create a new Ward (Municipal Admin)
export function useCreateWard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWardInput) => {
      const response = await apiClient.post<WardAdminItem>('/wards', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] });
      queryClient.invalidateQueries({ queryKey: ['wards'] });
    },
  });
}

// 4. Mutation Hook to create a new Service Zone (Ward Officer / Admin)
export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wardId, ...input }: CreateZoneInput) => {
      const response = await apiClient.post<ZoneAdminItem>(`/wards/${wardId}/zones`, input);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-zones', variables.wardId] });
      queryClient.invalidateQueries({ queryKey: ['admin-wards'] });
      queryClient.invalidateQueries({ queryKey: ['zones', variables.wardId] });
    },
  });
}

