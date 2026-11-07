export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type InvoiceItemType =
  | 'SUBSCRIPTION_MONTHLY'
  | 'BULKY_WASTE'
  | 'SPECIAL_COLLECTION'
  | 'LATE_FEE'
  | 'PENALTY';

export interface InvoiceItemDto {
  id: string;
  itemType: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceDetailDto {
  id: string;
  invoiceNumber: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  propertyId: string;
  propertyAddress: string;
  billingMonth: number;
  billingYear: number;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  items: InvoiceItemDto[];
  createdAt: string;
}

export interface InvoiceFilterQuery {
  page?: number;
  pageSize?: number;
  status?: InvoiceStatus;
  wardId?: string;
  citizenId?: string;
  billingMonth?: number;
  billingYear?: number;
}

export interface PaginatedInvoices {
  data: InvoiceDetailDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GenerateMonthlyInvoicesSummary {
  tenantId: string;
  billingMonth: number;
  billingYear: number;
  totalSubscriptionsProcessed: number;
  invoicesCreated: number;
  invoicesSkippedAlreadyBilled: number;
}

export interface CreateCustomInvoiceDto {
  citizenId: string;
  propertyId: string;
  billingMonth: number;
  billingYear: number;
  subtotalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  dueDate: string;
  notes?: string;
  items: Array<{
    itemType: InvoiceItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

