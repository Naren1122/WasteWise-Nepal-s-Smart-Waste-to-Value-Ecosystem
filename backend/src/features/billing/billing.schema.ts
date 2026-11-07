import { z } from 'zod';
import { InvoiceStatus, InvoiceItemType } from '@prisma/client';

export const InvoiceIdParamSchema = z.object({
  invoiceId: z.string().uuid({ message: 'Invoice ID must be a valid UUID' }),
});

export const InvoiceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(InvoiceStatus).optional(),
  wardId: z.string().uuid().optional(),
  citizenId: z.string().uuid().optional(),
  billingMonth: z.coerce.number().int().min(1).max(12).optional(),
  billingYear: z.coerce.number().int().min(2020).max(2100).optional(),
});

export const GenerateMonthlyInvoicesSchema = z.object({
  billingMonth: z.coerce.number().int().min(1).max(12).optional(),
  billingYear: z.coerce.number().int().min(2020).max(2100).optional(),
});

export const CreateInvoiceItemSchema = z.object({
  itemType: z.nativeEnum(InvoiceItemType).default(InvoiceItemType.SUBSCRIPTION_FEE),
  description: z.string().trim().min(3).max(255),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive({ message: 'Unit price must be positive' }),
});

export const CreateCustomInvoiceSchema = z.object({
  citizenId: z.string().uuid(),
  propertyId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  bulkyWasteRequestId: z.string().uuid().optional(),
  billingMonth: z.number().int().min(1).max(12),
  billingYear: z.number().int().min(2020).max(2100),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid due date format',
  }),
  items: z.array(CreateInvoiceItemSchema).min(1, { message: 'Invoice must contain at least one item' }),
  notes: z.string().max(500).optional(),
});

export type InvoiceIdParam = z.infer<typeof InvoiceIdParamSchema>;
export type InvoiceQueryDto = z.infer<typeof InvoiceQuerySchema>;
export type GenerateMonthlyInvoicesDto = z.infer<typeof GenerateMonthlyInvoicesSchema>;
export type CreateCustomInvoiceDto = z.infer<typeof CreateCustomInvoiceSchema>;

