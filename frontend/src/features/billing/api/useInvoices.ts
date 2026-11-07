import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type {
  InvoiceDetailDto,
  InvoiceFilterQuery,
  PaginatedInvoices,
  GenerateMonthlyInvoicesSummary,
  CreateCustomInvoiceDto,
} from '../types/billing.types';

function buildQueryString(filter?: InvoiceFilterQuery): string {
  if (!filter) return '';
  const searchParams = new URLSearchParams();
  if (filter.page) searchParams.set('page', String(filter.page));
  if (filter.pageSize) searchParams.set('pageSize', String(filter.pageSize));
  if (filter.status) searchParams.set('status', filter.status);
  if (filter.wardId) searchParams.set('wardId', filter.wardId);
  if (filter.citizenId) searchParams.set('citizenId', filter.citizenId);
  if (filter.billingMonth) searchParams.set('billingMonth', String(filter.billingMonth));
  if (filter.billingYear) searchParams.set('billingYear', String(filter.billingYear));
  const queryStr = searchParams.toString();
  return queryStr ? `?${queryStr}` : '';
}

/**
 * Fetch invoices for currently logged-in citizen
 */
export function useMyInvoices(
  filter?: InvoiceFilterQuery,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginatedInvoices>({
    queryKey: ['my-invoices', filter],
    queryFn: async () => {
      const qs = buildQueryString(filter);
      const res = await apiClient.get<PaginatedInvoices>(`/invoices/my${qs}`);
      return res.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch all municipal invoices (staff / admin / ward officer)
 */
export function useInvoices(
  filter?: InvoiceFilterQuery,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginatedInvoices>({
    queryKey: ['all-invoices', filter],
    queryFn: async () => {
      const qs = buildQueryString(filter);
      const res = await apiClient.get<PaginatedInvoices>(`/invoices${qs}`);
      return res.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single invoice by ID with line items and citizen details
 */
export function useInvoiceDetails(invoiceId: string | null) {
  return useQuery<InvoiceDetailDto>({
    queryKey: ['invoice-details', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('Invoice ID required');
      const res = await apiClient.get<InvoiceDetailDto>(`/invoices/${invoiceId}`);
      return res.data;
    },
    enabled: Boolean(invoiceId),
    staleTime: 60 * 1000,
  });
}

/**
 * Mutation to generate recurring monthly invoices (Municipal Admin / Super Admin)
 */
export function useGenerateMonthlyInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { billingMonth?: number; billingYear?: number }) => {
      const res = await apiClient.post<GenerateMonthlyInvoicesSummary>(
        '/invoices/generate-monthly',
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
    },
  });
}

/**
 * Mutation to create a manual custom invoice (Admin / Ward Officer)
 */
export function useCreateCustomInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCustomInvoiceDto) => {
      const res = await apiClient.post<InvoiceDetailDto>('/invoices/custom', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
    },
  });
}

