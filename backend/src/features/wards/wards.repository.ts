import { prisma } from '../../shared/database/prisma.service.js';
import type {
  IWardRepository,
  CreateWardData,
  UpdateWardData,
  CreateZoneData,
  UpdateZoneData,
  WardWithRelations,
  ZoneWithRelations,
} from './wards.types.js';

const wardInclude = {
  _count: {
    select: {
      serviceZones: true,
      properties: true,
    },
  },
} as const;

const zoneInclude = {
  _count: {
    select: {
      properties: true,
    },
  },
} as const;

export class WardRepository implements IWardRepository {
  public async findWardsByTenant(tenantId: string): Promise<WardWithRelations[]> {
    return prisma.ward.findMany({
      where: { tenantId },
      orderBy: { wardNumber: 'asc' },
      include: wardInclude,
    });
  }

  public async findWardById(tenantId: string, id: string): Promise<WardWithRelations | null> {
    return prisma.ward.findFirst({
      where: { id, tenantId },
      include: wardInclude,
    });
  }

  public async findWardByNumber(tenantId: string, wardNumber: number): Promise<WardWithRelations | null> {
    return prisma.ward.findFirst({
      where: { tenantId, wardNumber },
      include: wardInclude,
    });
  }

  public async createWard(data: CreateWardData): Promise<WardWithRelations> {
    return prisma.ward.create({
      data: {
        tenantId: data.tenantId,
        wardNumber: data.wardNumber,
        officeAddress: data.officeAddress ?? null,
        contactPhone: data.contactPhone ?? null,
      },
      include: wardInclude,
    });
  }

  public async updateWard(tenantId: string, id: string, data: UpdateWardData): Promise<WardWithRelations> {
    return prisma.ward.update({
      where: { id, tenantId },
      data: {
        ...(data.officeAddress !== undefined ? { officeAddress: data.officeAddress } : {}),
        ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
      },
      include: wardInclude,
    });
  }

  public async wardExists(tenantId: string, id: string): Promise<boolean> {
    const count = await prisma.ward.count({
      where: { id, tenantId },
    });
    return count > 0;
  }

  public async findZonesByWard(tenantId: string, wardId: string, onlyActive = false): Promise<ZoneWithRelations[]> {
    return prisma.serviceZone.findMany({
      where: {
        tenantId,
        wardId,
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: { code: 'asc' },
      include: zoneInclude,
    });
  }

  public async findZoneById(tenantId: string, id: string): Promise<ZoneWithRelations | null> {
    return prisma.serviceZone.findFirst({
      where: { id, tenantId },
      include: zoneInclude,
    });
  }

  public async findZoneByCode(tenantId: string, wardId: string, code: string): Promise<ZoneWithRelations | null> {
    return prisma.serviceZone.findFirst({
      where: { tenantId, wardId, code },
      include: zoneInclude,
    });
  }

  public async createZone(data: CreateZoneData): Promise<ZoneWithRelations> {
    return prisma.serviceZone.create({
      data: {
        tenantId: data.tenantId,
        wardId: data.wardId,
        name: data.name,
        code: data.code,
        description: data.description ?? null,
      },
      include: zoneInclude,
    });
  }

  public async updateZone(tenantId: string, id: string, data: UpdateZoneData): Promise<ZoneWithRelations> {
    return prisma.serviceZone.update({
      where: { id, tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: zoneInclude,
    });
  }
}
