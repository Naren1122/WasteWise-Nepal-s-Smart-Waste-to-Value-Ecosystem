import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma, Invoice, InvoiceStatus } from '@prisma/client';
import type {
  IBillingRepository,
  InvoiceWithRelations,
  CreateInvoiceData,
  InvoiceFilterQuery,
} from './billing.types.js';
import type { PaginatedResult } from '../../shared/types/api-response.types.js';

export class BillingRepository implements IBillingRepository {
  private readonly invoiceInclude = {
    items: true,
    property: true,
    citizen: {
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    },
    subscription: {
      include: {
        plan: true,
      },
    },
  } as const;

  public async findInvoices(
    tenantId: string,
    filter: InvoiceFilterQuery
  ): Promise<PaginatedResult<InvoiceWithRelations>> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.citizenId ? { citizenId: filter.citizenId } : {}),
      ...(filter.wardId ? { property: { wardId: filter.wardId } } : {}),
      ...(filter.billingMonth ? { billingMonth: filter.billingMonth } : {}),
      ...(filter.billingYear ? { billingYear: filter.billingYear } : {}),
    };

    const [totalItems, data] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: this.invoiceInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: data as InvoiceWithRelations[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  public async findInvoicesByCitizen(
    tenantId: string,
    citizenId: string,
    filter: InvoiceFilterQuery
  ): Promise<PaginatedResult<InvoiceWithRelations>> {
    return this.findInvoices(tenantId, { ...filter, citizenId });
  }

  public async findInvoiceById(
    tenantId: string,
    invoiceId: string
  ): Promise<InvoiceWithRelations | null> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: this.invoiceInclude,
    });
    return (invoice as InvoiceWithRelations) ?? null;
  }

  public async createInvoice(data: CreateInvoiceData): Promise<InvoiceWithRelations> {
    const created = await prisma.invoice.create({
      data: {
        tenantId: data.tenantId,
        citizenId: data.citizenId,
        propertyId: data.propertyId,
        subscriptionId: data.subscriptionId ?? null,
        bulkyWasteRequestId: data.bulkyWasteRequestId ?? null,
        invoiceNumber: data.invoiceNumber,
        billingMonth: data.billingMonth,
        billingYear: data.billingYear,
        subtotalAmount: data.subtotalAmount,
        discountAmount: data.discountAmount ?? 0,
        taxAmount: data.taxAmount ?? 0,
        totalAmount: data.totalAmount,
        dueDate: data.dueDate,
        status: data.status ?? 'ISSUED',
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            itemType: item.itemType,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: this.invoiceInclude,
    });

    return created as InvoiceWithRelations;
  }

  public async updateInvoiceStatus(
    tenantId: string,
    invoiceId: string,
    status: InvoiceStatus,
    paidAt?: Date
  ): Promise<Invoice> {
    return prisma.invoice.update({
      where: {
        id: invoiceId,
        tenantId,
      },
      data: {
        status,
        ...(paidAt !== undefined ? { paidAt } : {}),
      },
    });
  }

  public async checkExistingMonthlyInvoice(
    tenantId: string,
    subscriptionId: string,
    month: number,
    year: number
  ): Promise<boolean> {
    const count = await prisma.invoice.count({
      where: {
        tenantId,
        subscriptionId,
        billingMonth: month,
        billingYear: year,
      },
    });
    return count > 0;
  }

  public async findActiveSubscriptionsForBilling(tenantId?: string): Promise<
    Array<{
      id: string;
      tenantId: string;
      userId: string;
      propertyId: string;
      plan: { monthlyRateNpr: number; name: string };
    }>
  > {
    return prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        ...(tenantId ? { tenantId } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        propertyId: true,
        plan: {
          select: {
            monthlyRateNpr: true,
            name: true,
          },
        },
      },
    });
  }

  public async getNextInvoiceSequence(
    tenantId: string,
    year: number,
    month: number
  ): Promise<number> {
    const count = await prisma.invoice.count({
      where: {
        tenantId,
        billingYear: year,
        billingMonth: month,
      },
    });
    return count + 1;
  }
}

