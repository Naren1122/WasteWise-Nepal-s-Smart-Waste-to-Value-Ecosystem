import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from '@/shared/components/ui/sonner';
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
      const res = await apiClient.get<InvoiceDetailDto[]>(`/invoices/my${qs}`);
      const raw = res as unknown as {
        data: InvoiceDetailDto[];
        pagination: PaginatedInvoices['pagination'];
      };
      return {
        data: Array.isArray(raw.data) ? raw.data : [],
        pagination: raw.pagination || {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
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
      const res = await apiClient.get<InvoiceDetailDto[]>(`/invoices${qs}`);
      const raw = res as unknown as {
        data: InvoiceDetailDto[];
        pagination: PaginatedInvoices['pagination'];
      };
      return {
        data: Array.isArray(raw.data) ? raw.data : [],
        pagination: raw.pagination || {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      const count = data?.invoicesCreated ?? 0;
      toast.success('Invoices generated', {
        description: `Successfully billed ${count} propert${count === 1 ? 'y' : 'ies'}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Invoice generation failed', {
        description: err instanceof Error ? err.message : 'Please try again later.',
      });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      toast.success('Custom invoice created', {
        description: `Invoice #${data?.invoiceNumber ?? ''} created for NPR ${(data?.totalAmount ?? 0).toLocaleString()}.`,
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to create invoice', {
        description: err instanceof Error ? err.message : 'Please check required fields.',
      });
    },
  });
}

