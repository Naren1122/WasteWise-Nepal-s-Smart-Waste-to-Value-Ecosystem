import { Request, Response } from 'express';
import { SchedulesService } from './schedules.service.js';
import {
  CreateCollectionScheduleSchema,
  UpdateCollectionScheduleSchema,
  GeneratePickupsSchema,
  CalendarQuerySchema,
} from './schedules.schema.js';
import { BadRequestError } from '../../shared/errors/app-error.js';
import { IdParamSchema } from '../../shared/utils/param-validator.js';
import { sendSuccess } from '../../shared/utils/response.util.js';

export class SchedulesController {
  constructor(private readonly service: SchedulesService = new SchedulesService()) {}

  public createSchedule = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const input = CreateCollectionScheduleSchema.parse(req.body);
    const schedule = await this.service.createSchedule(req.tenant.id, input);
    sendSuccess(res, schedule, { status: 201, message: 'Collection schedule created successfully', tenantId: req.tenant.id });
  };

  public getSchedulesByWard = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id: wardId } = IdParamSchema.parse(req.params);
    const schedules = await this.service.getSchedulesByWard(req.tenant.id, wardId);
    sendSuccess(res, schedules, { tenantId: req.tenant.id });
  };

  public updateSchedule = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    const input = UpdateCollectionScheduleSchema.parse(req.body);
    const schedule = await this.service.updateSchedule(req.tenant.id, id, input);
    sendSuccess(res, schedule, { message: 'Collection schedule updated successfully', tenantId: req.tenant.id });
  };

  public deleteSchedule = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const { id } = IdParamSchema.parse(req.params);
    await this.service.deleteSchedule(req.tenant.id, id);
    sendSuccess(res, { deleted: true }, { message: 'Collection schedule deleted successfully', tenantId: req.tenant.id });
  };

  public generateDailyPickups = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const input = GeneratePickupsSchema.parse(req.body);
    const result = await this.service.generateDailyPickups(req.tenant.id, input);
    sendSuccess(res, result, { message: result.message, tenantId: req.tenant.id });
  };

  public getCalendarPickups = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) throw new BadRequestError('Tenant context required');
    const query = CalendarQuerySchema.parse(req.query);
    const pickups = await this.service.getCalendarPickups(req.tenant.id, query);
    sendSuccess(res, pickups, { tenantId: req.tenant.id });
  };
}
