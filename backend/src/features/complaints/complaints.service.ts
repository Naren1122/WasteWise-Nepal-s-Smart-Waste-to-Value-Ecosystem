import { Role } from '@prisma/client';
import { IComplaintsRepository, complaintsRepository } from './complaints.repository.js';
import type {
  ComplaintDetailDto,
  ComplaintSummaryDto,
  ComplaintQueryFilters,
  LodgeComplaintDto,
  TriageComplaintDto,
  ResolveComplaintDto,
  SubmitFeedbackDto,
  ReopenComplaintDto,
  LodgeComplaintResult,
} from './complaints.types.js';
import { VALID_STATUS_TRANSITIONS, ROLE_TRANSITION_PERMISSIONS } from './complaints.types.js';
import type { PaginatedResult } from '../../shared/types/api-response.types.js';
import type { UserContext } from '../../shared/types/user-context.types.js';
import { haversineDistanceMeters } from '../../shared/utils/geo.util.js';
import { uploadToCloudinary } from '../../shared/utils/cloudinary.service.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
} from '../../shared/errors/app-error.js';


const DUPLICATE_RADIUS_METERS = 50;
const DUPLICATE_WINDOW_HOURS = 48;
const REOPEN_GRACE_PERIOD_HOURS = 48;
const RESOLVE_ROLES: readonly Role[] = [
  Role.FIELD_WORKER,
  Role.DRIVER,
  Role.WARD_OFFICER,
  Role.MUNICIPAL_ADMIN,
  Role.SUPER_ADMIN,
];

export class ComplaintsService {
  constructor(private readonly repo: IComplaintsRepository = complaintsRepository) {}

  async lodgeComplaint(
    tenantId: string,
    citizenId: string,
    data: LodgeComplaintDto
  ): Promise<LodgeComplaintResult> {
    if (data.category === 'ILLEGAL_DUMPING' || data.category === 'OVERFLOWING_BIN') {
      const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 3600 * 1000);
      const candidates = await this.repo.findCandidateDuplicates(
        tenantId,
        data.wardId,
        data.category,
        windowStart
      );

      for (const candidate of candidates) {
        const dist = haversineDistanceMeters(data.latitude, data.longitude, candidate.latitude, candidate.longitude);
        if (dist <= DUPLICATE_RADIUS_METERS) {
          await this.repo.addSubscriber(candidate.id, citizenId);
          return {
            isDuplicate: true,
            parentTicketNumber: candidate.ticketNumber,
            parentId: candidate.id,
            message: 'A complaint has already been logged for this location and is being handled.',
          };
        }
      }
    }

    const slaHours = data.priority === 'CRITICAL' || data.category === 'MISSED_PICKUP' ? 24 : 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `WW-GRV-${datePrefix}-${randomSuffix}`;

    const processedAttachments = data.attachments?.length
      ? await Promise.all(
          data.attachments.map(async (att) => {
            if (att.fileUrl.startsWith('data:image/')) {
              const uploaded = await uploadToCloudinary(att.fileUrl, `wastewise/tenants/${tenantId}/complaints`);
              if (uploaded) {
                return {
                  ...att,
                  fileUrl: uploaded.secureUrl,
                  fileKey: uploaded.publicId,
                  fileSize: uploaded.bytes,
                };
              }
            }
            return att;
          })
        )
      : undefined;

    const payload = processedAttachments ? { ...data, attachments: processedAttachments } : data;
    const complaint = await this.repo.create(tenantId, citizenId, payload, ticketNumber, slaDeadline);
    return { isDuplicate: false, complaint };
  }

  async getComplaint(tenantId: string, id: string, user: UserContext): Promise<ComplaintDetailDto> {
    const complaint = await this.repo.findById(tenantId, id);
    if (!complaint) throw new NotFoundError('Complaint', id);
    this.authorizeAccess(complaint, user);
    return complaint;
  }

  async getComplaintByTicketNumber(tenantId: string, ticketNumber: string, user: UserContext): Promise<ComplaintDetailDto> {
    const complaint = await this.repo.findByTicketNumber(tenantId, ticketNumber);
    if (!complaint) throw new NotFoundError('Complaint with ticket number', ticketNumber);
    this.authorizeAccess(complaint, user);
    return complaint;
  }

  async listComplaints(
    tenantId: string,
    filters: ComplaintQueryFilters,
    user: UserContext
  ): Promise<PaginatedResult<ComplaintSummaryDto>> {
    const scopedFilters: ComplaintQueryFilters = { ...filters };
    if (user.role === Role.CITIZEN) scopedFilters.citizenId = user.id;
    else if (user.role === Role.WARD_OFFICER && user.wardId) scopedFilters.wardId = user.wardId;
    return this.repo.findMany(tenantId, scopedFilters);
  }

  async triageComplaint(
    tenantId: string,
    id: string,
    data: TriageComplaintDto,
    user: UserContext
  ): Promise<ComplaintDetailDto> {
    const complaint = await this.repo.findById(tenantId, id);
    if (!complaint) throw new NotFoundError('Complaint', id);
    if (user.role === Role.WARD_OFFICER && user.wardId && complaint.wardId !== user.wardId) {
      throw new ForbiddenError('Ward Officer cannot triage complaints outside assigned ward');
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[complaint.status];
    if (!allowedTransitions.includes(data.status)) {
      throw new ValidationError(`Cannot transition complaint from ${complaint.status} to ${data.status}`);
    }

    const allowedRoles = ROLE_TRANSITION_PERMISSIONS[data.status] ?? [];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(`Role ${user.role} is not authorized to set status ${data.status}`);
    }

    return this.repo.updateTriage(tenantId, id, user.id, user.role, data);
  }

  async resolveComplaint(
    tenantId: string,
    id: string,
    data: ResolveComplaintDto,
    user: UserContext
  ): Promise<ComplaintDetailDto> {
    const complaint = await this.repo.findById(tenantId, id);
    if (!complaint) throw new NotFoundError('Complaint', id);
    if (complaint.status !== 'ASSIGNED' && complaint.status !== 'IN_PROGRESS') {
      throw new ValidationError(`Cannot resolve complaint with status ${complaint.status}`);
    }
    if (!RESOLVE_ROLES.includes(user.role)) {
      throw new ForbiddenError('Not authorized to resolve complaints');
    }
    let payload = data;
    if (data.proofPhoto && data.proofPhoto.fileUrl.startsWith('data:image/')) {
      const uploaded = await uploadToCloudinary(data.proofPhoto.fileUrl, `wastewise/tenants/${tenantId}/resolutions`);
      if (uploaded) {
        payload = {
          ...data,
          proofPhoto: {
            ...data.proofPhoto,
            fileUrl: uploaded.secureUrl,
            fileKey: uploaded.publicId,
            fileSize: uploaded.bytes,
          },
        };
      }
    }

    return this.repo.resolve(tenantId, id, user.id, payload);
  }

  async reopenComplaint(
    tenantId: string,
    id: string,
    data: ReopenComplaintDto,
    user: UserContext
  ): Promise<ComplaintDetailDto> {
    const complaint = await this.repo.findById(tenantId, id);
    if (!complaint) throw new NotFoundError('Complaint', id);
    if (complaint.status !== 'RESOLVED') throw new ValidationError('Only resolved complaints can be reopened');
    if (user.role === Role.CITIZEN && complaint.citizenId !== user.id) {
      throw new ForbiddenError('Cannot reopen a complaint lodged by another citizen');
    }
    if (!complaint.resolvedAt) throw new BadRequestError('Resolution timestamp is missing');

    const elapsedMs = Date.now() - new Date(complaint.resolvedAt).getTime();
    if (elapsedMs > REOPEN_GRACE_PERIOD_HOURS * 3600 * 1000) {
      throw new BadRequestError('Cannot reopen complaint after 48-hour resolution grace period');
    }

    return this.repo.reopen(tenantId, id, user.id, data.reason);
  }

  async submitFeedback(tenantId: string, id: string, data: SubmitFeedbackDto, user: UserContext): Promise<void> {
    const complaint = await this.repo.findById(tenantId, id);
    if (!complaint) throw new NotFoundError('Complaint', id);
    if (complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED') {
      throw new ValidationError('Feedback can only be submitted for resolved or closed complaints');
    }
    if (complaint.citizenId !== user.id) throw new ForbiddenError('Only the reporting citizen can submit feedback');
    if (complaint.feedback) throw new BadRequestError('Feedback has already been submitted for this complaint');

    await this.repo.addFeedback(tenantId, id, data.rating, data.comments);
  }

  private authorizeAccess(complaint: ComplaintDetailDto, user: UserContext): void {
    if (user.role === Role.CITIZEN && complaint.citizenId !== user.id) {
      throw new ForbiddenError('Cannot view complaints filed by another citizen');
    }
    if (user.role === Role.WARD_OFFICER && user.wardId && complaint.wardId !== user.wardId) {
      throw new ForbiddenError('Cannot view complaints outside assigned ward');
    }
  }
}

export const complaintsService = new ComplaintsService();
