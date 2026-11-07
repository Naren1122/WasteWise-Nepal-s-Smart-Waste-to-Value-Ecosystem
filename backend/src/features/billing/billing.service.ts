import { BillingRepository } from './billing.repository.js';
import type {
  IBillingRepository,
  InvoiceWithRelations,
  InvoiceDetailDto,
  InvoiceFilterQuery,
  GenerateMonthlyInvoicesSummary,
} from './billing.types.js';
import type { CreateCustomInvoiceDto } from './billing.schema.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/app-error.js';
import { calculateItemTotal, roundNpr } from '../../shared/utils/currency.util.js';
import { Role, InvoiceItemType } from '@prisma/client';
import type { PaginatedResult } from '../../shared/types/api-response.types.js';

export class BillingService {
  constructor(private readonly repo: IBillingRepository = new BillingRepository()) {}

  public async getInvoices(
    tenantId: string,
    filter: InvoiceFilterQuery
  ): Promise<PaginatedResult<InvoiceDetailDto>> {
    const result = await this.repo.findInvoices(tenantId, filter);
    return {
      data: result.data.map(this.toInvoiceDetailDto),
      pagination: result.pagination,
    };
  }

  public async getCitizenInvoices(
    tenantId: string,
    citizenId: string,
    filter: InvoiceFilterQuery
  ): Promise<PaginatedResult<InvoiceDetailDto>> {
    const result = await this.repo.findInvoicesByCitizen(tenantId, citizenId, filter);
    return {
      data: result.data.map(this.toInvoiceDetailDto),
      pagination: result.pagination,
    };
  }

  public async getInvoiceById(
    tenantId: string,
    invoiceId: string,
    userContext?: { id: string; role: Role }
  ): Promise<InvoiceDetailDto> {
    const invoice = await this.repo.findInvoiceById(tenantId, invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    // Role-Scoped Authorization: Citizens can only access their own invoices
    if (userContext && userContext.role === Role.CITIZEN && invoice.citizenId !== userContext.id) {
      throw new ForbiddenError('Access denied: You do not own this invoice');
    }

    return this.toInvoiceDetailDto(invoice);
  }

  public async generateMonthlyInvoices(
    tenantId: string,
    month?: number,
    year?: number
  ): Promise<GenerateMonthlyInvoicesSummary> {
    const now = new Date();
    const billingMonth = month ?? now.getMonth() + 1; // 1-12
    const billingYear = year ?? now.getFullYear();

    const activeSubscriptions = await this.repo.findActiveSubscriptionsForBilling(tenantId);

    let invoicesCreated = 0;
    let invoicesSkipped = 0;

    // Due date defaults to 15 days from generation
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    for (const sub of activeSubscriptions) {
      const alreadyBilled = await this.repo.checkExistingMonthlyInvoice(
        tenantId,
        sub.id,
        billingMonth,
        billingYear
      );

      if (alreadyBilled) {
        invoicesSkipped++;
        continue;
      }

      const seq = await this.repo.getNextInvoiceSequence(tenantId, billingYear, billingMonth);
      const invoiceNumber = `INV-${billingYear}${String(billingMonth).padStart(2, '0')}-${String(seq).padStart(5, '0')}`;
      const rate = roundNpr(sub.plan.monthlyRateNpr);

      await this.repo.createInvoice({
        tenantId,
        citizenId: sub.userId,
        propertyId: sub.propertyId,
        subscriptionId: sub.id,
        invoiceNumber,
        billingMonth,
        billingYear,
        subtotalAmount: rate,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: rate,
        dueDate,
        items: [
          {
            itemType: InvoiceItemType.SUBSCRIPTION_FEE,
            description: `Monthly Municipal Waste Collection - ${sub.plan.name}`,
            quantity: 1,
            unitPrice: rate,
            totalPrice: rate,
          },
        ],
      });

      invoicesCreated++;
    }

    return {
      tenantId,
      billingMonth,
      billingYear,
      totalSubscriptionsProcessed: activeSubscriptions.length,
      invoicesCreated,
      invoicesSkippedAlreadyBilled: invoicesSkipped,
    };
  }

  public async createCustomInvoice(
    tenantId: string,
    dto: CreateCustomInvoiceDto
  ): Promise<InvoiceDetailDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestError('Invoice must contain at least one item');
    }

    const items = dto.items.map((item) => {
      const total = calculateItemTotal(item.quantity, item.unitPrice);
      return {
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: roundNpr(item.unitPrice),
        totalPrice: total,
      };
    });

    const subtotal = roundNpr(items.reduce((acc, item) => acc + item.totalPrice, 0));
    const totalAmount = subtotal;

    const seq = await this.repo.getNextInvoiceSequence(tenantId, dto.billingYear, dto.billingMonth);
    const invoiceNumber = `INV-MANUAL-${dto.billingYear}${String(dto.billingMonth).padStart(2, '0')}-${String(seq).padStart(5, '0')}`;

    const created = await this.repo.createInvoice({
      tenantId,
      citizenId: dto.citizenId,
      propertyId: dto.propertyId,
      subscriptionId: dto.subscriptionId ?? null,
      bulkyWasteRequestId: dto.bulkyWasteRequestId ?? null,
      invoiceNumber,
      billingMonth: dto.billingMonth,
      billingYear: dto.billingYear,
      subtotalAmount: subtotal,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount,
      dueDate: new Date(dto.dueDate),
      notes: dto.notes ?? null,
      items,
    });

    return this.toInvoiceDetailDto(created);
  }

  private toInvoiceDetailDto = (invoice: InvoiceWithRelations): InvoiceDetailDto => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    citizenId: invoice.citizenId,
    citizenName: invoice.citizen.fullName,
    citizenPhone: invoice.citizen.phone,
    propertyId: invoice.propertyId,
    propertyAddress: invoice.property.streetAddress,
    billingMonth: invoice.billingMonth,
    billingYear: invoice.billingYear,
    subtotalAmount: Number(invoice.subtotalAmount),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    status: invoice.status,
    dueDate: invoice.dueDate.toISOString(),
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
    items: invoice.items.map((i) => ({
      id: i.id,
      itemType: i.itemType,
      description: i.description,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    createdAt: invoice.createdAt.toISOString(),
  });
}

