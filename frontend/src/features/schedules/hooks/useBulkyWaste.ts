import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from '@/shared/components/ui/sonner';
import type {
  BulkyWasteRequest,
  BulkyWasteStatus,
  CreateBulkyRequestInput,
  QuoteBulkyRequestInput,
  ScheduleBulkyRequestInput,
  RejectBulkyRequestInput,
} from '../types/schedules.types';

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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
      toast.success('Bulky waste pickup requested', {
        description: `Request for "${res.data?.itemDescription ?? 'items'}" submitted for estimation.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to request pickup', {
        description: err instanceof Error ? err.message : 'Please check required fields.',
      });
    },
  });
}

export function useQuoteBulkyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: QuoteBulkyRequestInput }) => {
      return apiClient.patch<BulkyWasteRequest>(`/bulky-waste/${requestId}/quote`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bulky-waste'] });
      toast.success('Fee quote submitted', {
        description: `Quoted NPR ${variables.data.quotedAmountNpr.toLocaleString()} for collection.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to submit quote', {
        description: err instanceof Error ? err.message : 'Please verify quote amount.',
      });
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
      toast.success('Quote approved', {
        description: 'Bulky waste request is now ready for collection scheduling.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to approve quote', {
        description: err instanceof Error ? err.message : 'Please try again later.',
      });
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
      toast.success('Pickup scheduled', {
        description: 'Collection vehicle and schedule date assigned.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to schedule pickup', {
        description: err instanceof Error ? err.message : 'Please verify schedule date.',
      });
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
      toast.success('Request rejected', {
        description: 'Bulky waste request has been rejected.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to reject request', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
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
      toast.success('Pickup completed', {
        description: 'Bulky waste pickup has been successfully completed.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to complete pickup', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
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
      toast.success('Request cancelled', {
        description: 'Bulky waste request has been cancelled.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to cancel request', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    },
  });
}
