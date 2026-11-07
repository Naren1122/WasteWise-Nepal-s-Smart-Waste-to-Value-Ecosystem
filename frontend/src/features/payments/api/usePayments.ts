import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type {
  PaymentInitiateDto,
  PaymentInitiationResult,
  EsewaVerifyDto,
  KhaltiVerifyDto,
  CashPaymentDto,
  PaymentReceiptDto,
  PaymentVerificationResult,
} from '../types/payments.types';

/**
 * Mutation to initiate a digital payment via eSewa or Khalti
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: async (dto: PaymentInitiateDto) => {
      const res = await apiClient.post<PaymentInitiationResult>('/payments/initiate', dto);
      return res.data;
    },
  });
}

/**
 * Mutation to verify and settle an eSewa payment redirect
 */
export function useVerifyEsewaPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EsewaVerifyDto) => {
      const res = await apiClient.post<PaymentVerificationResult>(
        '/payments/esewa/verify',
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-details'] });
    },
  });
}

/**
 * Mutation to verify and settle a Khalti payment redirect
 */
export function useVerifyKhaltiPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: KhaltiVerifyDto) => {
      const res = await apiClient.post<PaymentVerificationResult>(
        '/payments/khalti/verify',
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-details'] });
    },
  });
}

/**
 * Mutation for Ward Cashiers to settle over-the-counter cash payments
 */
export function useRecordCashPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CashPaymentDto) => {
      const res = await apiClient.post<PaymentReceiptDto>('/payments/cash-counter', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-details'] });
    },
  });
}

/**
 * Hook to retrieve an official payment receipt for an invoice/payment
 */
export function usePaymentReceipt(paymentId: string | null) {
  return useQuery<PaymentReceiptDto>({
    queryKey: ['payment-receipt', paymentId],
    queryFn: async () => {
      if (!paymentId) throw new Error('Payment ID required');
      const res = await apiClient.get<PaymentReceiptDto>(`/payments/${paymentId}/receipt`);
      return res.data;
    },
    enabled: Boolean(paymentId),
    staleTime: 5 * 60 * 1000,
  });
}

