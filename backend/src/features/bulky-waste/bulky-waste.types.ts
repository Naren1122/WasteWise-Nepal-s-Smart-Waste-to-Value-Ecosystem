import type { Prisma } from '@prisma/client';
import { BulkyWasteStatus, Role } from '@prisma/client';

export { BulkyWasteStatus, Role };

export type BulkyRequestWithRelations = Prisma.BulkyWasteRequestGetPayload<{
  include: {
    property: {
      select: {
        id: true;
        streetAddress: true;
        houseNumber: true;
        wardId: true;
        ward: { select: { wardNumber: true } };
      };
    };
    user: {
      select: {
        id: true;
        fullName: true;
        phone: true;
        email: true;
      };
    };
  };
}>;

export interface BulkyWasteRequestDto {
  id: string;
  tenantId: string;
  propertyId: string;
  propertyAddress: string;
  wardNumber: number;
  userId: string;
  userName: string;
  userPhone: string;
  itemDescription: string;
  estimatedVolume: string | null;
  preferredDate: Date;
  scheduledDate: Date | null;
  status: BulkyWasteStatus;
  quotedAmountNpr: number | null;
  officerNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBulkyRequestData {
  tenantId: string;
  propertyId: string;
  userId: string;
  itemDescription: string;
  estimatedVolume?: string | null | undefined;
  preferredDate: Date;
}

export interface StatusUpdateExtras {
  quotedAmountNpr?: number | undefined;
  scheduledDate?: Date | undefined;
  officerNotes?: string | null | undefined;
}

export interface QuoteBulkyRequestData {
  quotedAmountNpr: number;
  officerNotes?: string | null | undefined;
}

export interface ScheduleBulkyRequestData {
  scheduledDate: Date;
  officerNotes?: string | null | undefined;
}

export interface RejectBulkyRequestData {
  officerNotes: string;
}

export interface CompleteBulkyRequestData {
  officerNotes?: string | null | undefined;
}

export interface BulkyRequestFilterParams {
  wardId?: string | undefined;
  status?: BulkyWasteStatus | undefined;
  userId?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface IBulkyWasteRepository {
  createRequest(data: CreateBulkyRequestData): Promise<BulkyRequestWithRelations>;
  findRequestById(tenantId: string, id: string): Promise<BulkyRequestWithRelations | null>;
  findRequests(tenantId: string, filter: BulkyRequestFilterParams): Promise<{ requests: BulkyRequestWithRelations[]; totalCount: number }>;
  transitionStatus(
    tenantId: string,
    id: string,
    fromStatuses: BulkyWasteStatus[],
    toStatus: BulkyWasteStatus,
    extra?: StatusUpdateExtras
  ): Promise<BulkyRequestWithRelations | null>;
}
