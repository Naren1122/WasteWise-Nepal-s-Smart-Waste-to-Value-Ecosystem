import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma, ComplaintCategory } from '@prisma/client';
import type {
  ComplaintDetailDto,
  ComplaintSummaryDto,
  ComplaintQueryFilters,
  LodgeComplaintDto,
  TriageComplaintDto,
  ResolveComplaintDto,
} from './complaints.types.js';
import type { PaginatedResult } from '../../shared/types/api-response.types.js';

export interface IComplaintsRepository {
  create(
    tenantId: string,
    citizenId: string,
    data: LodgeComplaintDto,
    ticketNumber: string,
    slaDeadline: Date
  ): Promise<ComplaintDetailDto>;
  findCandidateDuplicates(
    tenantId: string,
    wardId: string,
    category: ComplaintCategory,
    since: Date
  ): Promise<Array<{ id: string; ticketNumber: string; latitude: number; longitude: number }>>;
  addSubscriber(complaintId: string, citizenId: string): Promise<void>;
  findById(tenantId: string, id: string): Promise<ComplaintDetailDto | null>;
  findByTicketNumber(tenantId: string, ticketNumber: string): Promise<ComplaintDetailDto | null>;
  findMany(tenantId: string, filters: ComplaintQueryFilters): Promise<PaginatedResult<ComplaintSummaryDto>>;
  updateTriage(
    tenantId: string,
    id: string,
    performerId: string,
    performerRole: string,
    data: TriageComplaintDto
  ): Promise<ComplaintDetailDto>;
  resolve(
    tenantId: string,
    id: string,
    performerId: string,
    data: ResolveComplaintDto
  ): Promise<ComplaintDetailDto>;
  reopen(tenantId: string, id: string, citizenId: string, reason: string): Promise<ComplaintDetailDto>;
  addFeedback(
    tenantId: string,
    complaintId: string,
    rating: number,
    comments?: string
  ): Promise<void>;
}

const detailInclude = {
  ward: { select: { wardNumber: true } },
  citizen: { select: { fullName: true, phone: true } },
  assignedTo: { select: { fullName: true } },
  attachments: { orderBy: { createdAt: 'asc' as const } },
  timelines: {
    include: { performedBy: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  feedback: true,
  _count: { select: { subscribers: true } },
} satisfies Prisma.ComplaintInclude;

type ComplaintWithDetail = Prisma.ComplaintGetPayload<{ include: typeof detailInclude }>;

function mapToDetailDto(c: ComplaintWithDetail): ComplaintDetailDto {
  return {
    id: c.id,
    tenantId: c.tenantId,
    ticketNumber: c.ticketNumber,
    wardId: c.wardId,
    wardNumber: c.ward.wardNumber,
    citizenId: c.citizenId,
    citizenName: c.citizen.fullName,
    citizenPhone: c.citizen.phone,
    assignedToId: c.assignedToId,
    assignedToName: c.assignedTo?.fullName ?? null,
    category: c.category,
    priority: c.priority,
    status: c.status,
    title: c.title,
    description: c.description,
    latitude: c.latitude,
    longitude: c.longitude,
    addressText: c.addressText,
    slaDeadline: c.slaDeadline,
    isSlaBreached: c.isSlaBreached,
    rejectionReason: c.rejectionReason,
    resolvedAt: c.resolvedAt,
    closedAt: c.closedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    attachments: c.attachments.map((a) => ({
      id: a.id,
      attachmentType: a.attachmentType,
      fileUrl: a.fileUrl,
      fileKey: a.fileKey,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      uploadedById: a.uploadedById,
      createdAt: a.createdAt,
    })),
    timelines: c.timelines.map((t) => ({
      id: t.id,
      fromStatus: t.fromStatus,
      toStatus: t.toStatus,
      action: t.action,
      notes: t.notes,
      performedById: t.performedById,
      performedByName: t.performedBy?.fullName,
      createdAt: t.createdAt,
    })),
    feedback: c.feedback
      ? {
          id: c.feedback.id,
          rating: c.feedback.rating,
          comments: c.feedback.comments,
          createdAt: c.feedback.createdAt,
        }
      : null,
    subscriberCount: c._count.subscribers,
  };
}

export class ComplaintsRepository implements IComplaintsRepository {
  async create(
    tenantId: string,
    citizenId: string,
    data: LodgeComplaintDto,
    ticketNumber: string,
    slaDeadline: Date
  ): Promise<ComplaintDetailDto> {
    const complaint = await prisma.complaint.create({
      data: {
        tenantId,
        ticketNumber,
        wardId: data.wardId,
        citizenId,
        category: data.category,
        priority: data.priority ?? 'MEDIUM',
        status: 'SUBMITTED',
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        addressText: data.addressText ?? null,
        slaDeadline,
        ...(data.attachments?.length && {
          attachments: {
            createMany: {
              data: data.attachments.map((att) => ({
                attachmentType: 'REPORT_PHOTO' as const,
                fileUrl: att.fileUrl,
                fileKey: att.fileKey,
                mimeType: att.mimeType,
                fileSize: att.fileSize,
                uploadedById: citizenId,
              })),
            },
          },
        }),
        timelines: {
          create: {
            toStatus: 'SUBMITTED',
            action: 'LODGED',
            notes: 'Grievance submitted by citizen',
            performedById: citizenId,
          },
        },
      },
      include: detailInclude,
    });

    return mapToDetailDto(complaint as ComplaintWithDetail);
  }

  async findCandidateDuplicates(
    tenantId: string,
    wardId: string,
    category: ComplaintCategory,
    since: Date
  ): Promise<Array<{ id: string; ticketNumber: string; latitude: number; longitude: number }>> {
    return prisma.complaint.findMany({
      where: {
        tenantId,
        wardId,
        category,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
        createdAt: { gte: since },
      },
      select: { id: true, ticketNumber: true, latitude: true, longitude: true },
    });
  }

  async addSubscriber(complaintId: string, citizenId: string): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        await tx.complaintSubscriber.upsert({
          where: { complaintId_citizenId: { complaintId, citizenId } },
          create: { complaintId, citizenId },
          update: {},
        });
        await tx.complaintTimeline.create({
          data: {
            complaintId,
            toStatus: 'SUBMITTED',
            action: 'SUBSCRIBED',
            notes: 'Citizen linked as subscriber to clustered issue',
            performedById: citizenId,
          },
        });
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }

  async findById(tenantId: string, id: string): Promise<ComplaintDetailDto | null> {
    const complaint = await prisma.complaint.findFirst({
      where: { id, tenantId },
      include: detailInclude,
    });
    return complaint ? mapToDetailDto(complaint as ComplaintWithDetail) : null;
  }

  async findByTicketNumber(tenantId: string, ticketNumber: string): Promise<ComplaintDetailDto | null> {
    const complaint = await prisma.complaint.findFirst({
      where: { ticketNumber, tenantId },
      include: detailInclude,
    });
    return complaint ? mapToDetailDto(complaint as ComplaintWithDetail) : null;
  }

  async findMany(
    tenantId: string,
    filters: ComplaintQueryFilters
  ): Promise<PaginatedResult<ComplaintSummaryDto>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const where: Prisma.ComplaintWhereInput = {
      tenantId,
      ...(filters.wardId && { wardId: filters.wardId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.category && { category: filters.category }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.isSlaBreached !== undefined && { isSlaBreached: filters.isSlaBreached }),
      ...(filters.citizenId && { citizenId: filters.citizenId }),
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters.search && {
        OR: [
          { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [totalItems, rows] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          wardId: true,
          category: true,
          priority: true,
          status: true,
          title: true,
          latitude: true,
          longitude: true,
          slaDeadline: true,
          isSlaBreached: true,
          createdAt: true,
          resolvedAt: true,
          ward: { select: { wardNumber: true } },
        },
      }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        ticketNumber: r.ticketNumber,
        wardId: r.wardId,
        wardNumber: r.ward.wardNumber,
        category: r.category,
        priority: r.priority,
        status: r.status,
        title: r.title,
        latitude: r.latitude,
        longitude: r.longitude,
        slaDeadline: r.slaDeadline,
        isSlaBreached: r.isSlaBreached,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
        hasNextPage: page * pageSize < totalItems,
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateTriage(
    tenantId: string,
    id: string,
    performerId: string,
    performerRole: string,
    data: TriageComplaintDto
  ): Promise<ComplaintDetailDto> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.complaint.findFirstOrThrow({
        where: { id, tenantId },
      });

      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status: data.status,
          ...(data.priority && { priority: data.priority }),
          ...(data.assignedToId && { assignedToId: data.assignedToId }),
          ...(data.status === 'REJECTED' && {
            rejectionReason: data.rejectionReason ?? null,
            closedAt: new Date(),
          }),
        },
        include: detailInclude,
      });

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          fromStatus: current.status,
          toStatus: data.status,
          action: `TRIAGE_${data.status}`,
          notes: data.notes ?? data.rejectionReason ?? `Status updated by ${performerRole}`,
          performedById: performerId,
        },
      });

      return mapToDetailDto(updated as ComplaintWithDetail);
    }, { timeout: 15000, maxWait: 10000 });
  }

  async resolve(
    tenantId: string,
    id: string,
    performerId: string,
    data: ResolveComplaintDto
  ): Promise<ComplaintDetailDto> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.complaint.findFirstOrThrow({
        where: { id, tenantId },
      });

      const resolved = await tx.complaint.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          ...(data.proofPhoto && {
            attachments: {
              create: {
                attachmentType: 'RESOLUTION_PROOF' as const,
                fileUrl: data.proofPhoto.fileUrl,
                fileKey: data.proofPhoto.fileKey,
                mimeType: data.proofPhoto.mimeType,
                fileSize: data.proofPhoto.fileSize,
                uploadedById: performerId,
              },
            },
          }),
        },
        include: detailInclude,
      });

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          fromStatus: current.status,
          toStatus: 'RESOLVED',
          action: 'RESOLVED',
          notes: data.notes ?? 'Resolution proof uploaded by field staff',
          performedById: performerId,
        },
      });

      return mapToDetailDto(resolved as ComplaintWithDetail);
    }, { timeout: 15000, maxWait: 10000 });
  }

  async reopen(
    tenantId: string,
    id: string,
    citizenId: string,
    reason: string
  ): Promise<ComplaintDetailDto> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.complaint.findFirstOrThrow({
        where: { id, tenantId },
      });

      const reopened = await tx.complaint.update({
        where: { id },
        data: {
          status: 'REOPENED',
          resolvedAt: null,
        },
        include: detailInclude,
      });

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          fromStatus: current.status,
          toStatus: 'REOPENED',
          action: 'REOPENED_BY_CITIZEN',
          notes: reason,
          performedById: citizenId,
        },
      });

      return mapToDetailDto(reopened as ComplaintWithDetail);
    }, { timeout: 15000, maxWait: 10000 });
  }

  async addFeedback(
    tenantId: string,
    complaintId: string,
    rating: number,
    comments?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.complaint.findFirstOrThrow({ where: { id: complaintId, tenantId } });
      await tx.complaintFeedback.create({
        data: {
          complaintId,
          rating,
          comments: comments ?? null,
        },
      });
    }, { timeout: 15000, maxWait: 10000 });
  }
}

export const complaintsRepository = new ComplaintsRepository();
