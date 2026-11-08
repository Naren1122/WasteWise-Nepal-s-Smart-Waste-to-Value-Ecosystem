import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from '@/shared/components/ui/sonner';
import type {
  CollectionSchedule,
  ServicePlan,
  CreateServicePlanInput,
  CreateSubscriptionInput,
  CreateCollectionScheduleInput,
  GeneratePickupsInput,
} from '../types/schedules.types';

export * from './useBulkyWaste';

export function useCollectionSchedules(wardId?: string, dayOfWeek?: number) {
  return useQuery<CollectionSchedule[]>({
    queryKey: ['schedules', wardId, dayOfWeek],
    queryFn: async (): Promise<CollectionSchedule[]> => {
      const params = new URLSearchParams();
      if (wardId && wardId !== 'ALL') params.append('wardId', wardId);
      if (dayOfWeek !== undefined) params.append('dayOfWeek', dayOfWeek.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<CollectionSchedule[]>(`/schedules${query}`);
      return response.data || [];
    },
  });
}

export function useServicePlans() {
  return useQuery<ServicePlan[]>({
    queryKey: ['service-plans'],
    queryFn: async (): Promise<ServicePlan[]> => {
      const response = await apiClient.get<ServicePlan[]>('/plans');
      return response.data || [];
    },
  });
}

export function useCreateServicePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateServicePlanInput) => {
      return apiClient.post<ServicePlan>('/plans', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
      toast.success('Service plan created', {
        description: `Plan "${res.data?.name ?? 'New Plan'}" is now available.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to create plan', {
        description: err instanceof Error ? err.message : 'Please check required fields.',
      });
    },
  });
}

export function useDeleteServicePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      return apiClient.delete(`/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
      toast.success('Service plan deleted', {
        description: 'The service plan has been removed.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to delete plan', {
        description: err instanceof Error ? err.message : 'Plan may have active property subscriptions.',
      });
    },
  });
}

export function useToggleServicePlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, isActive }: { planId: string; isActive: boolean }) => {
      return apiClient.patch<ServicePlan>(`/plans/${planId}`, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
      toast.success('Service plan status updated', {
        description: `Plan is now ${variables.isActive ? 'active' : 'inactive'}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to update status', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSubscriptionInput) => {
      return apiClient.post('/subscriptions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property subscribed', {
        description: 'Service plan assigned to property successfully.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Subscription failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });
}

export function useCreateScheduleRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCollectionScheduleInput) => {
      return apiClient.post<CollectionSchedule>('/schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule rule created', {
        description: 'Waste collection schedule rule has been saved.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to save schedule rule', {
        description: err instanceof Error ? err.message : 'Please check schedule times.',
      });
    },
  });
}

export function useGenerateDailyPickups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GeneratePickupsInput) => {
      return apiClient.post<{ message: string; generatedCount: number }>('/schedules/generate', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      const count = res.data?.generatedCount ?? 0;
      toast.success('Pickups generated', {
        description: `Successfully generated ${count} daily collection manifest${count === 1 ? '' : 's'}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Generation failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });
}
