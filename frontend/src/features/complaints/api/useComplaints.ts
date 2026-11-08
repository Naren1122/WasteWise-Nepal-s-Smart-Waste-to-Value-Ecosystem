import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from '@/shared/components/ui/sonner';
import type {
  ComplaintDetailDto,
  ComplaintSummaryDto,
  ComplaintQueryFilters,
  LodgeComplaintPayload,
  LodgeComplaintResult,
  TriageComplaintPayload,
  ResolveComplaintPayload,
  SubmitFeedbackPayload,
  ReopenComplaintPayload,
} from '../types/complaints.types';

export interface PaginatedComplaints {
  data: ComplaintSummaryDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function buildQueryString(filters?: ComplaintQueryFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.status) params.set('status', filters.status);
  if (filters.wardId) params.set('wardId', filters.wardId);
  if (filters.category) params.set('category', filters.category);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.isSlaBreached !== undefined) params.set('isSlaBreached', String(filters.isSlaBreached));
  if (filters.citizenId) params.set('citizenId', filters.citizenId);
  if (filters.assignedToId) params.set('assignedToId', filters.assignedToId);
  if (filters.search) params.set('search', filters.search);
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function useComplaints(filters?: ComplaintQueryFilters) {
  return useQuery<PaginatedComplaints>({
    queryKey: ['complaints', filters],
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const res = await apiClient.get<ComplaintSummaryDto[]>(`/complaints${qs}`);
      const raw = res as unknown as {
        data: ComplaintSummaryDto[];
        pagination: PaginatedComplaints['pagination'];
      };
      return {
        data: Array.isArray(raw.data) ? raw.data : [],
        pagination: raw.pagination ?? {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    },
    staleTime: 15_000,
  });
}

export function useComplaintDetail(id?: string) {
  return useQuery<ComplaintDetailDto>({
    queryKey: ['complaint', id],
    queryFn: async () => {
      if (!id) throw new Error('Complaint ID required');
      const res = await apiClient.get<ComplaintDetailDto>(`/complaints/${id}`);
      return (res as unknown as { data: ComplaintDetailDto }).data ?? res;
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useLodgeComplaint() {
  const queryClient = useQueryClient();
  return useMutation<LodgeComplaintResult, Error, LodgeComplaintPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<LodgeComplaintResult>('/complaints', payload);
      return (res as unknown as { data: LodgeComplaintResult }).data ?? res;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['complaints'] });
      if (data.isDuplicate) {
        toast.info('Similar complaint already logged', {
          description: `Merged into existing Ticket #${data.parentTicketNumber}.`,
        });
      } else {
        toast.success('Grievance registered', {
          description: `Ticket #${data.complaint.ticketNumber} lodged successfully.`,
        });
      }
    },
    onError: (err) => {
      toast.error('Failed to lodge grievance', {
        description: err.message || 'Please check all required fields.',
      });
    },
  });
}

export function useTriageComplaint() {
  const queryClient = useQueryClient();
  return useMutation<ComplaintDetailDto, Error, { id: string; payload: TriageComplaintPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient.patch<ComplaintDetailDto>(`/complaints/${id}/triage`, payload);
      return (res as unknown as { data: ComplaintDetailDto }).data ?? res;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['complaints'] });
      void queryClient.invalidateQueries({ queryKey: ['complaint', variables.id] });
      toast.success('Complaint triaged', {
        description: `Ticket #${data.ticketNumber} priority & assigned officer updated.`,
      });
    },
    onError: (err) => {
      toast.error('Triage failed', {
        description: err.message || 'Could not update complaint triage.',
      });
    },
  });
}

export function useResolveComplaint() {
  const queryClient = useQueryClient();
  return useMutation<ComplaintDetailDto, Error, { id: string; payload: ResolveComplaintPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient.patch<ComplaintDetailDto>(`/complaints/${id}/resolve`, payload);
      return (res as unknown as { data: ComplaintDetailDto }).data ?? res;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['complaints'] });
      void queryClient.invalidateQueries({ queryKey: ['complaint', variables.id] });
      toast.success('Complaint resolved', {
        description: `Ticket #${data.ticketNumber} has been resolved.`,
      });
    },
    onError: (err) => {
      toast.error('Resolution failed', {
        description: err.message || 'Could not resolve complaint.',
      });
    },
  });
}

export function useReopenComplaint() {
  const queryClient = useQueryClient();
  return useMutation<ComplaintDetailDto, Error, { id: string; payload: ReopenComplaintPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient.post<ComplaintDetailDto>(`/complaints/${id}/reopen`, payload);
      return (res as unknown as { data: ComplaintDetailDto }).data ?? res;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['complaints'] });
      void queryClient.invalidateQueries({ queryKey: ['complaint', variables.id] });
      toast.success('Complaint reopened', {
        description: `Ticket #${data.ticketNumber} reopened for further investigation.`,
      });
    },
    onError: (err) => {
      toast.error('Failed to reopen complaint', {
        description: err.message || 'Could not reopen complaint.',
      });
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string; payload: SubmitFeedbackPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient.post<{ success: boolean }>(`/complaints/${id}/feedback`, payload);
      return (res as unknown as { data: { success: boolean } }).data ?? res;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['complaint', variables.id] });
      toast.success('Feedback submitted', {
        description: 'Thank you for rating municipal resolution services.',
      });
    },
    onError: (err) => {
      toast.error('Failed to submit feedback', {
        description: err.message || 'Please try again later.',
      });
    },
  });
}

