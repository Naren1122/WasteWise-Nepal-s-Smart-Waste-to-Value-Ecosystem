import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type { LiveVehicleState, RouteBreadcrumb } from '../types/tracking.types';

export async function fetchActiveFleetPositions(): Promise<LiveVehicleState[]> {
  const response = await apiClient.get<LiveVehicleState[]>('/tracking/fleet');
  return response.data || [];
}

export async function fetchRouteBreadcrumbs(routeId: string): Promise<RouteBreadcrumb[]> {
  const response = await apiClient.get<RouteBreadcrumb[]>(`/tracking/routes/${routeId}/breadcrumbs?limit=250`);
  return response.data || [];
}

/**
 * Hook to fetch active fleet positions.
 * Configured with 5-second stale time as per WasteWise Rule 6.2.
 */
export function useFleetPositions() {
  return useQuery<LiveVehicleState[]>({
    queryKey: ['fleet-positions'],
    queryFn: fetchActiveFleetPositions,
    staleTime: 5000,
    refetchInterval: 10000, // Background fallback polling if WebSocket is temporarily disconnected
  });
}

/**
 * Hook to fetch breadcrumb trail coordinates for a selected route.
 */
export function useRouteBreadcrumbs(routeId?: string | null) {
  return useQuery<RouteBreadcrumb[]>({
    queryKey: ['route-breadcrumbs', routeId],
    queryFn: () => fetchRouteBreadcrumbs(routeId!),
    enabled: Boolean(routeId),
    staleTime: 30000,
  });
}

