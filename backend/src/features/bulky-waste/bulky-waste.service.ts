import { BulkyWasteRepository } from './bulky-waste.repository.js';
import { PropertyRepository } from '../properties/properties.repository.js';
import type {
  IBulkyWasteRepository,
  BulkyWasteRequestDto,
  BulkyRequestFilterParams,
  BulkyRequestWithRelations,
} from './bulky-waste.types.js';
import type {
  CreateBulkyRequestInput,
  QuoteBulkyRequestInput,
  ScheduleBulkyRequestInput,
  RejectBulkyRequestInput,
  CompleteBulkyRequestInput,
} from './bulky-waste.schema.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../shared/errors/app-error.js';
import { Role, BulkyWasteStatus } from '@prisma/client';
import { BULKY_WASTE_TRANSITIONS } from './bulky-waste.constants.js';
import { RequestContext } from '../../shared/utils/request-context.js';

export class BulkyWasteService {
  constructor(
    private readonly repo: IBulkyWasteRepository = new BulkyWasteRepository(),
    private readonly propertyRepo = new PropertyRepository()
  ) {}

  public async submitRequest(
    tenantId: string,
    userId: string,
    userRole: Role,
    dto: CreateBulkyRequestInput
  ): Promise<BulkyWasteRequestDto> {
    const property = await this.propertyRepo.findPropertyById(tenantId, dto.propertyId);
    if (!property) throw new NotFoundError('Property', dto.propertyId);

    if (userRole === Role.CITIZEN && property.userId !== userId) {
      throw new ForbiddenError('You can only submit bulky waste requests for your own properties');
    }

    const requestOwnerId = userRole === Role.CITIZEN ? userId : property.userId;

    const created = await this.repo.createRequest({
      tenantId,
      propertyId: dto.propertyId,
      userId: requestOwnerId,
      itemDescription: dto.itemDescription,
      estimatedVolume: dto.estimatedVolume,
      preferredDate: dto.preferredDate,
    });

    return this.toDto(created);
  }

  public async quoteRequest(
    tenantId: string,
    requestId: string,
    dto: QuoteBulkyRequestInput,
    officerWardId?: string | null
  ): Promise<BulkyWasteRequestDto> {
    const request = await this.findAndAuthorize(tenantId, requestId, undefined, undefined, officerWardId);

    this.assertTransitionAllowed(request.status, BulkyWasteStatus.QUOTED);

    const updated = await this.repo.transitionStatus(
      tenantId,
      requestId,
      [BulkyWasteStatus.SUBMITTED, BulkyWasteStatus.QUOTED],
      BulkyWasteStatus.QUOTED,
      {
        quotedAmountNpr: dto.quotedAmountNpr,
        officerNotes: dto.officerNotes,
      }
    );

    if (!updated) {
      throw new ConflictError('Request state changed concurrently, please refresh');
    }

    return this.toDto(updated);
  }

  public async approveQuotation(
    tenantId: string,
    requestId: string,
    userId: string,
    userRole: Role
  ): Promise<BulkyWasteRequestDto> {
    const request = await this.findAndAuthorize(tenantId, requestId, userId, userRole);

    this.assertTransitionAllowed(request.status, BulkyWasteStatus.APPROVED);

    const updated = await this.repo.transitionStatus(
      tenantId,
      requestId,
      [BulkyWasteStatus.QUOTED],
      BulkyWasteStatus.APPROVED
    );

    if (!updated) {
      throw new ConflictError('Request state changed concurrently, please refresh');
    }

    return this.toDto(updated);
  }

  public async schedulePickup(
    tenantId: string,
    requestId: string,
    dto: ScheduleBulkyRequestInput,
    officerWardId?: string | null
  ): Promise<BulkyWasteRequestDto> {
    const request = await this.findAndAuthorize(tenantId, requestId, undefined, undefined, officerWardId);

    this.assertTransitionAllowed(request.status, BulkyWasteStatus.SCHEDULED);

    const updated = await this.repo.transitionStatus(
      tenantId,
      requestId,
      [BulkyWasteStatus.APPROVED, BulkyWasteStatus.SCHEDULED],
      BulkyWasteStatus.SCHEDULED,
      {
        scheduledDate: dto.scheduledDate,
        officerNotes: dto.officerNotes,
      }
    );

    if (!updated) {
      throw new ConflictError('Request state changed concurrently, please refresh');
    }

    return this.toDto(updated);
  }

  public async rejectRequest(
    tenantId: string,
    requestId: string,
    dto: RejectBulkyRequestInput,
    officerWardId?: string | null
  ): Promise<BulkyWasteRequestDto> {
    const request = await this.findAndAuthorize(tenantId, requestId, undefined, undefined, officerWardId);

    this.assertTransitionAllowed(request.status, BulkyWasteStatus.REJECTED);

    const updated = await this.repo.transitionStatus(
      tenantId,
      requestId,
      [BulkyWasteStatus.SUBMITTED, BulkyWasteStatus.QUOTED],
      BulkyWasteStatus.REJECTED,
      { officerNotes: dto.officerNotes }
    );

    if (!updated) {
      throw new ConflictError('Request state changed concurrently, please refresh');
    }

    return this.toDto(updated);
  }

  public async completeRequest(
    tenantId: string,
    requestId: string,
    dto: CompleteBulkyRequestInput,
    officerWardId?: string | null
  ): Promise<BulkyWasteRequestDto> {
    const request = await this.findAndAuthorize(tenantId, requestId, undefined, undefined, officerWardId);

    this.assertTransitionAllowed(request.status, BulkyWasteStatus.COMPLETED);

    const updated = await this.repo.transitionStatus(
      tenantId,
      requestId,
      [BulkyWasteStatus.SCHEDULED],
      BulkyWasteStatus.COMPLETED,
      { officerNotes: dto.officerNotes }
    );

    if (!updated) {
      throw new ConflictError('Request state changed concurrently, please refresh');
    }

    return this.toDto(updated);
  }

  public async cancelRequest(
    tenantId: string,
    requestId: string,
    userId: string,
    userRole: Role,
    officerWardId?: string | null
  ): Promise<BulkyWasteRequestDto> {
    const request = await this.findAndAuthorize(tenantId, requestId, userId, userRole, officerWardId);

    this.assertTransitionAllowed(request.status, BulkyWasteStatus.CANCELLED);

    const updated = await this.repo.transitionStatus(
      tenantId,
      requestId,
      [
        BulkyWasteStatus.SUBMITTED,
        BulkyWasteStatus.QUOTED,
        BulkyWasteStatus.APPROVED,
        BulkyWasteStatus.SCHEDULED,
      ],
      BulkyWasteStatus.CANCELLED
    );

    if (!updated) {
      throw new ConflictError('Request state changed concurrently, please refresh');
    }

    return this.toDto(updated);
  }

  public async getRequests(
    ctx: RequestContext,
    filter: BulkyRequestFilterParams
  ): Promise<{ items: BulkyWasteRequestDto[]; totalCount: number }> {
    const scopedFilter: BulkyRequestFilterParams = {
      ...filter,
      ...(ctx.role === Role.CITIZEN ? { userId: ctx.userId } : {}),
      ...(ctx.role === Role.WARD_OFFICER && ctx.wardId ? { wardId: ctx.wardId } : {}),
    };

    const { requests, totalCount } = await this.repo.findRequests(ctx.tenantId, scopedFilter);
    return {
      items: requests.map((r) => this.toDto(r)),
      totalCount,
    };
  }

  public async getRequestById(
    tenantId: string,
    id: string,
    userId: string,
    role: Role,
    officerWardId?: string | null
  ): Promise<BulkyWasteRequestDto> {
    const request = await this.findAndAuthorize(tenantId, id, userId, role, officerWardId);
    return this.toDto(request);
  }

  private async findAndAuthorize(
    tenantId: string,
    id: string,
    userId?: string,
    role?: Role,
    officerWardId?: string | null
  ): Promise<BulkyRequestWithRelations> {
    const request = await this.repo.findRequestById(tenantId, id);

    // 404 on non-existence or unauthorized access to prevent IDOR existence leakage
    if (!request) {
      throw new NotFoundError('Bulky waste request', id);
    }

    if (role === Role.CITIZEN && userId && request.userId !== userId) {
      throw new NotFoundError('Bulky waste request', id);
    }

    if (role === Role.WARD_OFFICER && officerWardId && request.property.wardId !== officerWardId) {
      throw new NotFoundError('Bulky waste request', id);
    }

    return request;
  }

  private assertTransitionAllowed(from: BulkyWasteStatus, to: BulkyWasteStatus): void {
    const allowed = BULKY_WASTE_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new ConflictError(
        `Cannot transition bulky waste request from '${from}' to '${to}'. Allowed: [${(allowed || []).join(', ')}]`
      );
    }
  }

  private toDto(r: BulkyRequestWithRelations): BulkyWasteRequestDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      propertyId: r.propertyId,
      propertyAddress: `${r.property.houseNumber ?? ''} ${r.property.streetAddress}`.trim(),
      wardNumber: r.property.ward.wardNumber,
      userId: r.userId,
      userName: r.user.fullName,
      userPhone: r.user.phone,
      itemDescription: r.itemDescription,
      estimatedVolume: r.estimatedVolume,
      preferredDate: r.preferredDate,
      scheduledDate: r.scheduledDate,
      status: r.status,
      quotedAmountNpr: r.quotedAmountNpr !== null ? Number(r.quotedAmountNpr) : null,
      officerNotes: r.officerNotes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
