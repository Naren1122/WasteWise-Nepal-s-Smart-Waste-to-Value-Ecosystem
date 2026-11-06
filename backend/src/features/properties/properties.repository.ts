import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma } from '@prisma/client';
import type {
  IPropertyRepository,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyFilterParams,
  PropertyWithRelations,
} from './properties.types.js';

const propertyInclude = {
  ward: { select: { wardNumber: true } },
  zone: { select: { name: true } },
} as const;

export class PropertyRepository implements IPropertyRepository {
  public async createProperty(data: CreatePropertyData): Promise<PropertyWithRelations> {
    return prisma.property.create({
      data: {
        tenantId: data.tenantId,
        wardId: data.wardId,
        zoneId: data.zoneId ?? null,
        userId: data.userId,
        propertyType: data.propertyType,
        houseNumber: data.houseNumber ?? null,
        streetAddress: data.streetAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
      },
      include: propertyInclude,
    });
  }

  public async findPropertyById(
    tenantId: string,
    id: string
  ): Promise<PropertyWithRelations | null> {
    return prisma.property.findFirst({
      where: { id, tenantId },
      include: propertyInclude,
    });
  }

  public async findPropertiesByUserId(
    tenantId: string,
    userId: string
  ): Promise<PropertyWithRelations[]> {
    return prisma.property.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      include: propertyInclude,
    });
  }

  public async findProperties(
    tenantId: string,
    filter: PropertyFilterParams
  ): Promise<{ properties: PropertyWithRelations[]; totalCount: number }> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 8;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PropertyWhereInput = {
      tenantId,
      ...(filter.wardId ? { wardId: filter.wardId } : {}),
      ...(filter.zoneId ? { zoneId: filter.zoneId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.propertyType ? { propertyType: filter.propertyType } : {}),
      ...(filter.search
        ? {
            OR: [
              { houseNumber: { contains: filter.search, mode: 'insensitive' } },
              { streetAddress: { contains: filter.search, mode: 'insensitive' } },
              { contactName: { contains: filter.search, mode: 'insensitive' } },
              { contactPhone: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: propertyInclude,
      }),
      prisma.property.count({ where }),
    ]);

    return { properties, totalCount };
  }

  public async updateProperty(
    tenantId: string,
    id: string,
    data: UpdatePropertyData
  ): Promise<PropertyWithRelations> {
    return prisma.property.update({
      where: { id, tenantId },
      data: {
        ...(data.wardId !== undefined ? { wardId: data.wardId } : {}),
        ...(data.zoneId !== undefined ? { zoneId: data.zoneId } : {}),
        ...(data.propertyType !== undefined ? { propertyType: data.propertyType } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.houseNumber !== undefined ? { houseNumber: data.houseNumber } : {}),
        ...(data.streetAddress !== undefined ? { streetAddress: data.streetAddress } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.contactName !== undefined ? { contactName: data.contactName } : {}),
        ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
      },
      include: propertyInclude,
    });
  }

  public async deleteProperty(tenantId: string, id: string): Promise<void> {
    await prisma.property.delete({
      where: { id, tenantId },
    });
  }

  public async verifyWardExists(tenantId: string, wardId: string): Promise<boolean> {
    const count = await prisma.ward.count({
      where: { id: wardId, tenantId },
    });
    return count > 0;
  }

  public async verifyZoneExists(tenantId: string, wardId: string, zoneId: string): Promise<boolean> {
    const count = await prisma.serviceZone.count({
      where: { id: zoneId, wardId, tenantId, isActive: true },
    });
    return count > 0;
  }
}
