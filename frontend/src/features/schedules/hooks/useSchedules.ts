import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type {
  CollectionSchedule,
  ServicePlan,
  BulkyWasteRequest,
  BulkyWasteStatus,
  CreateBulkyRequestInput,
  QuoteBulkyRequestInput,
  ScheduleBulkyRequestInput,
  RejectBulkyRequestInput,
  CreateServicePlanInput,
  CreateSubscriptionInput,
  CreateCollectionScheduleInput,
  GeneratePickupsInput,
} from '../types/schedules.types';

export function useCollectionSchedules(wardId?: string) {
  return useQuery<CollectionSchedule[]>({
    queryKey: ['schedules', wardId],
    queryFn: async (): Promise<CollectionSchedule[]> => {
      const url = wardId && wardId !== 'ALL' ? `/schedules?wardId=${wardId}` : '/schedules';
      const response = await apiClient.get<CollectionSchedule[]>(url);
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

export interface BulkyFilterParams {
  wardId?: string;
  status?: BulkyWasteStatus;
}

export function useBulkyWasteRequests(filters?: BulkyFilterParams) {
  return useQuery<BulkyWasteRequest[]>({
    queryKey: ['bulky-waste', filters?.wardId, filters?.status],
    queryFn: async (): Promise<BulkyWasteRequest[]> => {
      const params = new URLSearchParams();
      if (filters?.wardId && filters.wardId !== 'ALL') params.append('wardId', filters.wardId);
      if (filters?.status) params.append('status', filters.status);
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<BulkyWasteRequest[]>(`/bulky-waste${query}`);
      return response.data || [];
    },
  });
}

export function useCreateBulkyWasteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBulkyRequestInput) => {
      return apiClient.post<BulkyWasteRequest>('/bulky-waste', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}

export function useQuoteBulkyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: QuoteBulkyRequestInput }) => {
      return apiClient.patch<BulkyWasteRequest>(`/bulky-waste/${requestId}/quote`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}

export function useApproveBulkyQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      return apiClient.post<BulkyWasteRequest>(`/bulky-waste/${requestId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}

export function useScheduleBulkyPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: ScheduleBulkyRequestInput }) => {
      return apiClient.patch<BulkyWasteRequest>(`/bulky-waste/${requestId}/schedule`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}

export function useRejectBulkyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: RejectBulkyRequestInput }) => {
      return apiClient.post<BulkyWasteRequest>(`/bulky-waste/${requestId}/reject`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}

export function useCompleteBulkyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      return apiClient.post<BulkyWasteRequest>(`/bulky-waste/${requestId}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}

export function useCancelBulkyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      return apiClient.post<BulkyWasteRequest>(`/bulky-waste/${requestId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}

export function useCreateServicePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateServicePlanInput) => {
      return apiClient.post<ServicePlan>('/plans', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
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
    },
  });
}

export function useToggleServicePlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, isActive }: { planId: string; isActive: boolean }) => {
      return apiClient.patch<ServicePlan>(`/plans/${planId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
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
    },
  });
}

export function useGenerateDailyPickups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GeneratePickupsInput) => {
      return apiClient.post<{ message: string; generatedCount: number }>('/schedules/generate', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

