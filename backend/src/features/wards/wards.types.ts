import type { Prisma } from '@prisma/client';

export type WardWithRelations = Prisma.WardGetPayload<{
  include: {
    _count: {
      select: {
        serviceZones: true;
        properties: true;
      };
    };
  };
}>;

export type ZoneWithRelations = Prisma.ServiceZoneGetPayload<{
  include: {
    _count: {
      select: {
        properties: true;
      };
    };
  };
}>;

export interface WardDto {
  id: string;
  tenantId: string;
  wardNumber: number;
  officeAddress: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
  zoneCount: number;
  propertyCount: number;
}

export interface ZoneDto {
  id: string;
  tenantId: string;
  wardId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  propertyCount: number;
}

export interface CreateWardData {
  tenantId: string;
  wardNumber: number;
  officeAddress?: string | null | undefined;
  contactPhone?: string | null | undefined;
}

export interface UpdateWardData {
  officeAddress?: string | null | undefined;
  contactPhone?: string | null | undefined;
}

export interface CreateZoneData {
  tenantId: string;
  wardId: string;
  name: string;
  code: string;
  description?: string | null | undefined;
}

export interface UpdateZoneData {
  name?: string | undefined;
  description?: string | null | undefined;
  isActive?: boolean | undefined;
}

export interface IWardRepository {
  findWardsByTenant(tenantId: string): Promise<WardWithRelations[]>;
  findWardById(tenantId: string, id: string): Promise<WardWithRelations | null>;
  findWardByNumber(tenantId: string, wardNumber: number): Promise<WardWithRelations | null>;
  createWard(data: CreateWardData): Promise<WardWithRelations>;
  updateWard(tenantId: string, id: string, data: UpdateWardData): Promise<WardWithRelations>;
  wardExists(tenantId: string, id: string): Promise<boolean>;

  findZonesByWard(tenantId: string, wardId: string, onlyActive?: boolean): Promise<ZoneWithRelations[]>;
  findZoneById(tenantId: string, id: string): Promise<ZoneWithRelations | null>;
  findZoneByCode(tenantId: string, wardId: string, code: string): Promise<ZoneWithRelations | null>;
  createZone(data: CreateZoneData): Promise<ZoneWithRelations>;
  updateZone(tenantId: string, id: string, data: UpdateZoneData): Promise<ZoneWithRelations>;
}
