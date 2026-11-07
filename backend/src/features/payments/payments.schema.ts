import { z } from 'zod';
import { PaymentGateway } from '@prisma/client';

export const PaymentIdParamSchema = z.object({
  paymentId: z.string().uuid({ message: 'Payment ID must be a valid UUID' }),
});

export const InitiatePaymentSchema = z.object({
  invoiceId: z.string().uuid({ message: 'Invoice ID must be a valid UUID' }),
  gateway: z.nativeEnum(PaymentGateway, {
    errorMap: () => ({ message: 'Gateway must be either ESEWA, KHALTI, or CASH_COUNTER' }),
  }),
});

export const EsewaCallbackSchema = z.object({
  data: z.string().min(1, { message: 'eSewa base64 data string is required' }),
});

export const KhaltiCallbackSchema = z.object({
  pidx: z.string().min(1, { message: 'Khalti pidx is required' }),
  transactionReference: z.string().optional(),
});

export const CashPaymentSchema = z.object({
  invoiceId: z.string().uuid({ message: 'Invoice ID must be a valid UUID' }),
  receivedAmount: z.number().positive({ message: 'Received amount must be a positive number' }),
  payerId: z.string().uuid().optional(),
  notes: z.string().max(255).optional(),
});

export type InitiatePaymentDto = z.infer<typeof InitiatePaymentSchema>;
export type EsewaCallbackDto = z.infer<typeof EsewaCallbackSchema>;
export type KhaltiCallbackDto = z.infer<typeof KhaltiCallbackSchema>;
export type CashPaymentDto = z.infer<typeof CashPaymentSchema>;

