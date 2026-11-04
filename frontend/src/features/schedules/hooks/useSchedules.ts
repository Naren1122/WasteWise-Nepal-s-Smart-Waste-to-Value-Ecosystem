import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type {
  CollectionSchedule,
  ServicePlan,
  BulkyWasteRequest,
} from '../types/schedules.types';

export function useCollectionSchedules(wardId?: string) {
  return useQuery<CollectionSchedule[]>({
    queryKey: ['schedules', wardId],
    queryFn: async (): Promise<CollectionSchedule[]> => {
      const url = wardId ? `/schedules?wardId=${wardId}` : '/schedules';
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

export function useBulkyWasteRequests() {
  return useQuery<BulkyWasteRequest[]>({
    queryKey: ['bulky-waste'],
    queryFn: async (): Promise<BulkyWasteRequest[]> => {
      const response = await apiClient.get<BulkyWasteRequest[]>('/bulky-waste');
      return response.data || [];
    },
  });
}

export function useScheduleBulkyPickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      scheduledDate,
      quotedAmountNpr,
    }: {
      requestId: string;
      scheduledDate: string;
      quotedAmountNpr?: number;
    }) => {
      return apiClient.patch<BulkyWasteRequest>(
        `/bulky-waste/${requestId}/schedule`,
        { scheduledDate, quotedAmountNpr }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
    },
  });
}
