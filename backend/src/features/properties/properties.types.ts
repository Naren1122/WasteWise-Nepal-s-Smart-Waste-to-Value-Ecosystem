import type { Prisma } from '@prisma/client';
import { PropertyType, PropertyStatus, Role } from '@prisma/client';

export { PropertyType, PropertyStatus, Role };

export type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: {
    ward: { select: { wardNumber: true } };
    zone: { select: { name: true } };
  };
}>;

export interface PropertyDto {
  id: string;
  tenantId: string;
  wardId: string;
  wardNumber: number;
  zoneId: string | null;
  zoneName: string | null;
  userId: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  houseNumber: string | null;
  streetAddress: string;
  latitude: number;
  longitude: number;
  qrCode: string | null;
  contactName: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePropertyData {
  tenantId: string;
  wardId: string;
  zoneId?: string | null | undefined;
  userId: string;
  propertyType: PropertyType;
  houseNumber?: string | null | undefined;
  streetAddress: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
}

export interface UpdatePropertyData {
  wardId?: string | undefined;
  zoneId?: string | null | undefined;
  propertyType?: PropertyType | undefined;
  status?: PropertyStatus | undefined;
  houseNumber?: string | null | undefined;
  streetAddress?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  contactName?: string | undefined;
  contactPhone?: string | undefined;
}

export interface PropertyFilterParams {
  wardId?: string | undefined;
  zoneId?: string | undefined;
  status?: PropertyStatus | undefined;
  propertyType?: PropertyType | undefined;
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface IPropertyRepository {
  createProperty(data: CreatePropertyData): Promise<PropertyWithRelations>;
  findPropertyById(tenantId: string, id: string): Promise<PropertyWithRelations | null>;
  findPropertiesByUserId(tenantId: string, userId: string): Promise<PropertyWithRelations[]>;
  findProperties(tenantId: string, filter: PropertyFilterParams): Promise<{ properties: PropertyWithRelations[]; totalCount: number }>;
  updateProperty(tenantId: string, id: string, data: UpdatePropertyData): Promise<PropertyWithRelations>;
  deleteProperty(tenantId: string, id: string): Promise<void>;
  verifyWardExists(tenantId: string, wardId: string): Promise<boolean>;
  verifyZoneExists(tenantId: string, wardId: string, zoneId: string): Promise<boolean>;
}
