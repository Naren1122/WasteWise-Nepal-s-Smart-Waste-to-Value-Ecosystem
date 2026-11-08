import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from '@/shared/components/ui/sonner';
import type {
  Vehicle,
  DriverSummary,
  CreateDriverInput,
  CreateStaffInput,
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleFilterParams,
  PaginatedVehiclesData,
} from '../types/fleet.types';

export function useVehicles(filters?: VehicleFilterParams) {
  return useQuery<PaginatedVehiclesData>({
    queryKey: ['fleet', filters],
    queryFn: async (): Promise<PaginatedVehiclesData> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters?.assignedDriverId) params.append('assignedDriverId', filters.assignedDriverId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<Vehicle[]>(`/fleet${query}`);
      
      const rawRes = response as unknown as {
        data: Vehicle[];
        pagination?: {
          page: number;
          pageSize: number;
          totalItems?: number;
          totalCount?: number;
          totalPages: number;
        };
      };

      const vehicles = Array.isArray(rawRes.data) ? rawRes.data : [];
      const totalCount = rawRes.pagination?.totalItems ?? rawRes.pagination?.totalCount ?? vehicles.length;

      return {
        vehicles,
        totalCount,
        page: rawRes.pagination?.page ?? 1,
        pageSize: rawRes.pagination?.pageSize ?? 20,
        totalPages: rawRes.pagination?.totalPages ?? 1,
      };
    },
  });
}

export function useEligibleDrivers() {
  return useQuery<DriverSummary[]>({
    queryKey: ['fleet-drivers'],
    queryFn: async (): Promise<DriverSummary[]> => {
      const response = await apiClient.get<DriverSummary[]>('/fleet/drivers');
      return response.data || [];
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVehicleInput) => {
      return apiClient.post<Vehicle>('/fleet', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      toast.success('Vehicle registered successfully', {
        description: `Plate: ${res.data?.registrationNo || 'New Vehicle'} is now in the municipal fleet.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to register vehicle', {
        description: err instanceof Error ? err.message : 'Please check the provided inputs.',
      });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVehicleInput }) => {
      return apiClient.patch<Vehicle>(`/fleet/${id}`, data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      toast.success('Vehicle updated successfully', {
        description: `Vehicle status: ${res.data?.status || 'Updated'}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to update vehicle', {
        description: err instanceof Error ? err.message : 'Please try again later.',
      });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<{ message: string }>(`/fleet/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      toast.success('Vehicle removed', {
        description: 'The vehicle was successfully deleted from the fleet.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to delete vehicle', {
        description: err instanceof Error ? err.message : 'Vehicle may have active assigned routes.',
      });
    },
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStaffInput) => {
      return apiClient.post('/auth/staff', {
        ...data,
        role: data.role || 'DRIVER',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fleet-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      const roleLabel = (variables.role || 'DRIVER').replace('_', ' ');
      toast.success('Personnel registered successfully', {
        description: `${variables.fullName} has been registered as ${roleLabel}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to register personnel', {
        description: err instanceof Error ? err.message : 'Please verify details and try again.',
      });
    },
  });
}

export const useCreateDriver = useCreateStaff;
