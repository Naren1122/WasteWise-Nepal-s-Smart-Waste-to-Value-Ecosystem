import type { Request, Response } from 'express';
import { z } from 'zod';
import { ComplaintsService, complaintsService } from './complaints.service.js';
import {
  LodgeComplaintSchema,
  TriageComplaintSchema,
  ResolveComplaintSchema,
  SubmitFeedbackSchema,
  ReopenComplaintSchema,
  ComplaintQuerySchema,
} from './complaints.schema.js';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.util.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const UUIDParamSchema = z.string().uuid('Invalid UUID parameter');
const TicketParamSchema = z.string().min(5, 'Invalid ticket number').max(32);

export class ComplaintsController {
  constructor(private readonly service: ComplaintsService = complaintsService) {}

  public lodgeComplaint = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const payload = LodgeComplaintSchema.parse(req.body);
    const result = await this.service.lodgeComplaint(req.tenant.id, req.user.id, payload);

    if (result.isDuplicate) {
      sendSuccess(res, result, {
        status: 200,
        message: result.message,
        tenantId: req.tenant.id,
      });
      return;
    }

    sendSuccess(res, result, {
      status: 201,
      message: 'Complaint lodged successfully',
      tenantId: req.tenant.id,
    });
  };

  public listComplaints = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const filters = ComplaintQuerySchema.parse(req.query);
    const result = await this.service.listComplaints(req.tenant.id, filters, req.user);

    sendPaginated(
      res,
      result.data,
      {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalCount: result.pagination.totalItems,
      },
      {
        message: 'Complaints retrieved successfully',
        tenantId: req.tenant.id,
      }
    );
  };

  public getComplaintById = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const id = UUIDParamSchema.parse(req.params.id);
    const complaint = await this.service.getComplaint(req.tenant.id, id, req.user);

    sendSuccess(res, complaint, {
      message: 'Complaint retrieved successfully',
      tenantId: req.tenant.id,
    });
  };

  public getComplaintByTicket = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const ticketNumber = TicketParamSchema.parse(req.params.ticketNumber);
    const complaint = await this.service.getComplaintByTicketNumber(req.tenant.id, ticketNumber, req.user);

    sendSuccess(res, complaint, {
      message: 'Complaint retrieved successfully',
      tenantId: req.tenant.id,
    });
  };

  public triageComplaint = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const id = UUIDParamSchema.parse(req.params.id);
    const payload = TriageComplaintSchema.parse(req.body);
    const updated = await this.service.triageComplaint(req.tenant.id, id, payload, req.user);

    sendSuccess(res, updated, {
      message: 'Complaint triaged successfully',
      tenantId: req.tenant.id,
    });
  };

  public resolveComplaint = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const id = UUIDParamSchema.parse(req.params.id);
    const payload = ResolveComplaintSchema.parse(req.body);
    const resolved = await this.service.resolveComplaint(req.tenant.id, id, payload, req.user);

    sendSuccess(res, resolved, {
      message: 'Complaint marked as resolved',
      tenantId: req.tenant.id,
    });
  };

  public reopenComplaint = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const id = UUIDParamSchema.parse(req.params.id);
    const payload = ReopenComplaintSchema.parse(req.body);
    const reopened = await this.service.reopenComplaint(req.tenant.id, id, payload, req.user);

    sendSuccess(res, reopened, {
      message: 'Complaint reopened successfully',
      tenantId: req.tenant.id,
    });
  };

  public submitFeedback = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant || !req.user) throw new UnauthorizedError();
    const id = UUIDParamSchema.parse(req.params.id);
    const payload = SubmitFeedbackSchema.parse(req.body);
    await this.service.submitFeedback(req.tenant.id, id, payload, req.user);

    sendSuccess(res, { success: true }, {
      message: 'Feedback submitted successfully',
      tenantId: req.tenant.id,
    });
  };
}

export const complaintsController = new ComplaintsController();

