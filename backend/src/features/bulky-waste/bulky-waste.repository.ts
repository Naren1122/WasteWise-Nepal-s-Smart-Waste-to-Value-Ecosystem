import { prisma } from '../../shared/database/prisma.service.js';
import { Prisma } from '@prisma/client';
import type {
  IBulkyWasteRepository,
  CreateBulkyRequestData,
  BulkyRequestFilterParams,
  BulkyRequestWithRelations,
  BulkyWasteStatus,
  StatusUpdateExtras,
} from './bulky-waste.types.js';

const bulkyInclude = {
  property: {
    select: {
      id: true,
      streetAddress: true,
      houseNumber: true,
      wardId: true,
      ward: { select: { wardNumber: true } },
    },
  },
  user: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    },
  },
} as const;

export class BulkyWasteRepository implements IBulkyWasteRepository {
  public async createRequest(data: CreateBulkyRequestData): Promise<BulkyRequestWithRelations> {
    return prisma.bulkyWasteRequest.create({
      data: {
        tenantId: data.tenantId,
        propertyId: data.propertyId,
        userId: data.userId,
        itemDescription: data.itemDescription,
        estimatedVolume: data.estimatedVolume ?? null,
        preferredDate: data.preferredDate,
      },
      include: bulkyInclude,
    });
  }

  public async findRequestById(tenantId: string, id: string): Promise<BulkyRequestWithRelations | null> {
    return prisma.bulkyWasteRequest.findFirst({
      where: { id, tenantId },
      include: bulkyInclude,
    });
  }

  public async findRequests(
    tenantId: string,
    filter: BulkyRequestFilterParams
  ): Promise<{ requests: BulkyRequestWithRelations[]; totalCount: number }> {
    const where: Prisma.BulkyWasteRequestWhereInput = {
      tenantId,
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.wardId ? { property: { wardId: filter.wardId } } : {}),
    };

    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 8;

    const [requests, totalCount] = await Promise.all([
      prisma.bulkyWasteRequest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: bulkyInclude,
      }),
      prisma.bulkyWasteRequest.count({ where }),
    ]);

    return { requests, totalCount };
  }

  public async transitionStatus(
    tenantId: string,
    id: string,
    fromStatuses: BulkyWasteStatus[],
    toStatus: BulkyWasteStatus,
    extra?: StatusUpdateExtras
  ): Promise<BulkyRequestWithRelations | null> {
    const data: Prisma.BulkyWasteRequestUpdateManyMutationInput = {
      status: toStatus,
    };

    if (extra?.quotedAmountNpr !== undefined) {
      data.quotedAmountNpr = extra.quotedAmountNpr;
    }
    if (extra?.scheduledDate !== undefined) {
      data.scheduledDate = extra.scheduledDate;
    }
    if (extra?.officerNotes !== undefined) {
      data.officerNotes = extra.officerNotes;
    }

    const { count } = await prisma.bulkyWasteRequest.updateMany({
      where: {
        id,
        tenantId,
        status: { in: fromStatuses },
      },
      data,
    });

    if (count === 0) return null;

    return this.findRequestById(tenantId, id);
  }
}
