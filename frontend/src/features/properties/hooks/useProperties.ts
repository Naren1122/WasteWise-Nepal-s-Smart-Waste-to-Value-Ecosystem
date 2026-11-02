import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'INSTITUTIONAL';
export type PropertyStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'INACTIVE';

export interface Property {
  id: string;
  tenantId: string;
  wardId: string;
  wardNumber?: number;
  zoneId: string | null;
  zoneName?: string | null;
  userId: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  houseNumber: string | null;
  streetAddress: string;
  latitude: number;
  longitude: number;
  qrCode: string | null;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ward {
  id: string;
  wardNumber: number;
  officeAddress: string | null;
  contactPhone: string | null;
  zoneCount?: number;
  propertyCount?: number;
}

export interface ServiceZone {
  id: string;
  wardId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
}

export interface CreatePropertyInput {
  wardId: string;
  zoneId?: string | null;
  propertyType: PropertyType;
  houseNumber?: string | null;
  streetAddress: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
}

// 1. Hook to fetch Wards for property registration dropdowns
export function useWards() {
  return useQuery<Ward[]>({
    queryKey: ['wards'],
    queryFn: async () => {
      const response = await apiClient.get<Ward[]>('/wards');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Master data caches for 5 minutes
  });
}

// 2. Hook to fetch Service Zones for a selected ward
export function useZones(wardId?: string | null) {
  return useQuery<ServiceZone[]>({
    queryKey: ['zones', wardId],
    queryFn: async () => {
      if (!wardId) return [];
      const response = await apiClient.get<ServiceZone[]>(`/wards/${wardId}/zones`);
      return response.data;
    },
    enabled: !!wardId,
    staleTime: 5 * 60 * 1000,
  });
}

// 3. Hook to fetch Citizen's registered properties
export function useMyProperties() {
  return useQuery<Property[]>({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const response = await apiClient.get<Property[]>('/properties/me');
      return response.data;
    },
  });
}

// 4. Mutation Hook to register a new property
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePropertyInput) => {
      const response = await apiClient.post<Property>('/properties', input);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate my-properties cache so the list auto-refreshes
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    },
  });
}

