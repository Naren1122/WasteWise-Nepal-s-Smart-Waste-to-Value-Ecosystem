import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from '@/shared/components/ui/sonner';
import type {
  Route,
  RouteStop,
  GenerateDailyRouteInput,
  UpdateRouteStatusInput,
  UpdateStopStatusInput,
  OfflineStopSyncItem,
  RouteFilterParams,
  PaginatedRoutesData,
} from '../types/routes.types';

export function useRoutes(filters?: RouteFilterParams) {
  return useQuery<PaginatedRoutesData>({
    queryKey: ['routes', filters],
    queryFn: async (): Promise<PaginatedRoutesData> => {
      const params = new URLSearchParams();
      if (filters?.wardId) params.append('wardId', filters.wardId);
      if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
      if (filters?.driverId) params.append('driverId', filters.driverId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.routeDate) params.append('routeDate', filters.routeDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<Route[]>(`/routes${query}`);

      const rawRes = response as unknown as {
        data: Route[];
        pagination?: {
          page: number;
          pageSize: number;
          totalItems?: number;
          totalCount?: number;
          totalPages: number;
        };
      };

      const routes = Array.isArray(rawRes.data) ? rawRes.data : [];
      const totalCount = rawRes.pagination?.totalItems ?? rawRes.pagination?.totalCount ?? routes.length;

      return {
        routes,
        totalCount,
        page: rawRes.pagination?.page ?? 1,
        pageSize: rawRes.pagination?.pageSize ?? 20,
        totalPages: rawRes.pagination?.totalPages ?? 1,
      };
    },
  });
}

export function useRouteById(id?: string) {
  return useQuery<Route | null>({
    queryKey: ['route', id],
    queryFn: async (): Promise<Route | null> => {
      if (!id) return null;
      const response = await apiClient.get<Route>(`/routes/${id}`);
      return response.data || null;
    },
    enabled: Boolean(id),
  });
}

export function useActiveDriverRoute() {
  return useQuery<Route | null>({
    queryKey: ['driver-active-route'],
    queryFn: async (): Promise<Route | null> => {
      const response = await apiClient.get<Route | null>('/routes/driver/active');
      return response.data || null;
    },
    refetchInterval: 15000,
  });
}

export function useGenerateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateDailyRouteInput) => {
      return apiClient.post<Route>('/routes/generate', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route generated successfully', {
        description: `Route for Ward #${res.data?.wardNumber ?? ''} created with ${res.data?.stopsCount ?? 0} stops.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to generate route', {
        description: err instanceof Error ? err.message : 'Please check route parameters.',
      });
    },
  });
}

export function useUpdateRouteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRouteStatusInput }) => {
      return apiClient.patch<Route>(`/routes/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-route'] });
      const statusLabel = variables.data.status ? variables.data.status.replace(/_/g, ' ') : 'Updated';
      toast.success('Route status updated', {
        description: `Route marked as ${statusLabel}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to update route status', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });
}

export function useUpdateStopStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stopId, data }: { stopId: string; data: UpdateStopStatusInput }) => {
      return apiClient.patch<RouteStop>(`/routes/stops/${stopId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-route'] });
      toast.success('Stop status updated', {
        description: `Stop marked as ${variables.data.status.replace(/_/g, ' ')}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to update stop', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });
}

export function useBatchOfflineSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: OfflineStopSyncItem[]) => {
      return apiClient.post<{ syncedCount: number }>('/routes/sync', { updates });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-route'] });
      const count = res.data?.syncedCount ?? 0;
      toast.success('Stops synced successfully', {
        description: `${count} offline stop updates synced to server.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to sync stops', {
        description: err instanceof Error ? err.message : 'Please check network connection.',
      });
    },
  });
}
