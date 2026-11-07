import type { Request, Response } from 'express';
import { BillingService } from './billing.service.js';
import {
  InvoiceIdParamSchema,
  InvoiceQuerySchema,
  GenerateMonthlyInvoicesSchema,
  CreateCustomInvoiceSchema,
} from './billing.schema.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

export class BillingController {
  constructor(private readonly service: BillingService = new BillingService()) {}

  public getInvoices = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');

    const query = InvoiceQuerySchema.parse(req.query);
    const result = await this.service.getInvoices(req.tenant.id, query);

    sendPaginated(
      res,
      result.data,
      {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalCount: result.pagination.totalItems,
      },
      {
        message: 'Invoices retrieved successfully',
        tenantId: req.tenant.id,
      }
    );
  };

  public getMyInvoices = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const query = InvoiceQuerySchema.parse(req.query);
    const result = await this.service.getCitizenInvoices(req.tenant.id, req.user.id, query);

    sendPaginated(
      res,
      result.data,
      {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalCount: result.pagination.totalItems,
      },
      {
        message: 'My invoices retrieved successfully',
        tenantId: req.tenant.id,
      }
    );
  };

  public getInvoiceById = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');

    const { invoiceId } = InvoiceIdParamSchema.parse(req.params);
    const invoice = await this.service.getInvoiceById(req.tenant.id, invoiceId, req.user);

    sendSuccess(res, invoice, {
      message: 'Invoice retrieved successfully',
      tenantId: req.tenant.id,
    });
  };

  public generateMonthlyInvoices = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');

    const { billingMonth, billingYear } = GenerateMonthlyInvoicesSchema.parse(req.body);
    const summary = await this.service.generateMonthlyInvoices(
      req.tenant.id,
      billingMonth,
      billingYear
    );

    sendSuccess(res, summary, {
      status: 201,
      message: 'Monthly recurring invoices generated successfully',
      tenantId: req.tenant.id,
    });
  };

  public createCustomInvoice = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new UnauthorizedError('Tenant context required');

    const body = CreateCustomInvoiceSchema.parse(req.body);
    const created = await this.service.createCustomInvoice(req.tenant.id, body);

    sendSuccess(res, created, {
      status: 201,
      message: 'Custom invoice created successfully',
      tenantId: req.tenant.id,
    });
  };
}

