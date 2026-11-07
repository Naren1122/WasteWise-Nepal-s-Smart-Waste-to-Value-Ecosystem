import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  InvoiceItemType,
  Property,
  User,
  Subscription,
  ServicePlan,
} from '@prisma/client';
import type { PaginatedResult } from '../../shared/types/api-response.types.js';

export type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  property: Property;
  citizen: Pick<User, 'id' | 'fullName' | 'email' | 'phone'>;
  subscription?: (Subscription & { plan: ServicePlan }) | null;
};

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

export interface CreateInvoiceItemData {
  itemType: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateInvoiceData {
  tenantId: string;
  citizenId: string;
  propertyId: string;
  subscriptionId?: string | null;
  bulkyWasteRequestId?: string | null;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  subtotalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  dueDate: Date;
  status?: InvoiceStatus;
  notes?: string | null;
  items: CreateInvoiceItemData[];
}

export interface InvoiceFilterQuery {
  page?: number | undefined;
  pageSize?: number | undefined;
  status?: InvoiceStatus | undefined;
  wardId?: string | undefined;
  citizenId?: string | undefined;
  billingMonth?: number | undefined;
  billingYear?: number | undefined;
}

export interface GenerateMonthlyInvoicesSummary {
  tenantId: string;
  billingMonth: number;
  billingYear: number;
  totalSubscriptionsProcessed: number;
  invoicesCreated: number;
  invoicesSkippedAlreadyBilled: number;
}

export interface IBillingRepository {
  findInvoices(tenantId: string, filter: InvoiceFilterQuery): Promise<PaginatedResult<InvoiceWithRelations>>;
  findInvoicesByCitizen(
    tenantId: string,
    citizenId: string,
    filter: InvoiceFilterQuery
  ): Promise<PaginatedResult<InvoiceWithRelations>>;
  findInvoiceById(tenantId: string, invoiceId: string): Promise<InvoiceWithRelations | null>;
  createInvoice(data: CreateInvoiceData): Promise<InvoiceWithRelations>;
  updateInvoiceStatus(
    tenantId: string,
    invoiceId: string,
    status: InvoiceStatus,
    paidAt?: Date
  ): Promise<Invoice>;
  checkExistingMonthlyInvoice(
    tenantId: string,
    subscriptionId: string,
    month: number,
    year: number
  ): Promise<boolean>;
  findActiveSubscriptionsForBilling(tenantId?: string): Promise<
    Array<{
      id: string;
      tenantId: string;
      userId: string;
      propertyId: string;
      plan: { monthlyRateNpr: number; name: string };
    }>
  >;
  getNextInvoiceSequence(tenantId: string, year: number, month: number): Promise<number>;
}
