import { PropertyRepository } from './properties.repository.js';
import type {
  IPropertyRepository,
  PropertyDto,
  PropertyFilterParams,
  PropertyWithRelations,
  Role,
} from './properties.types.js';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  UpdatePropertyStatusDto,
} from './properties.schema.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../shared/errors/app-error.js';
import { PropertyStatus } from './properties.types.js';

export class PropertyService {
  constructor(private readonly repo: IPropertyRepository = new PropertyRepository()) {}

  public async registerProperty(
    tenantId: string,
    userId: string,
    dto: CreatePropertyDto
  ): Promise<PropertyDto> {
    // 1. Verify ward exists within this municipality tenant
    const wardExists = await this.repo.verifyWardExists(tenantId, dto.wardId);
    if (!wardExists) {
      throw new NotFoundError('Ward in this municipality', dto.wardId);
    }

    // 2. If a zone is provided, verify it exists and belongs to the given ward
    if (dto.zoneId) {
      const zoneExists = await this.repo.verifyZoneExists(tenantId, dto.wardId, dto.zoneId);
      if (!zoneExists) {
        throw new ValidationError({
          zoneId: ['The selected service zone does not exist or does not belong to this ward'],
        });
      }
    }

    const property = await this.repo.createProperty({
      tenantId,
      userId,
      wardId: dto.wardId,
      zoneId: dto.zoneId ?? null,
      propertyType: dto.propertyType,
      houseNumber: dto.houseNumber ?? null,
      streetAddress: dto.streetAddress,
      latitude: dto.latitude,
      longitude: dto.longitude,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
    });

    return this.mapToDto(property);
  }

  public async getMyProperties(tenantId: string, userId: string): Promise<PropertyDto[]> {
    const properties = await this.repo.findPropertiesByUserId(tenantId, userId);
    return properties.map((p) => this.mapToDto(p));
  }

  public async getPropertyById(
    tenantId: string,
    propertyId: string,
    currentUser: { id: string; role: Role; wardId?: string | null }
  ): Promise<PropertyDto> {
    const property = await this.repo.findPropertyById(tenantId, propertyId);
    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    // Allow-list Authorization check:
    // Citizens can only view their own properties
    if (currentUser.role === 'CITIZEN' && property.userId !== currentUser.id) {
      throw new ForbiddenError('You do not have permission to view this property');
    }

    // Ward officers can only view properties within their assigned ward
    if (currentUser.role === 'WARD_OFFICER' && currentUser.wardId && property.wardId !== currentUser.wardId) {
      throw new ForbiddenError('You can only view properties in your assigned ward');
    }

    return this.mapToDto(property);
  }

  public async listProperties(
    tenantId: string,
    currentUser: { id: string; role: Role; wardId?: string | null },
    filter: PropertyFilterParams
  ): Promise<{ properties: PropertyDto[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    // If user is a Ward Officer, strictly scope their queries to their own ward
    const effectiveWardId = currentUser.role === 'WARD_OFFICER' && currentUser.wardId
      ? currentUser.wardId
      : filter.wardId;

    const effectiveFilter: PropertyFilterParams = {
      ...filter,
      wardId: effectiveWardId,
    };

    const page = effectiveFilter.page ?? 1;
    const pageSize = effectiveFilter.pageSize ?? 20;

    const { properties, totalCount } = await this.repo.findProperties(tenantId, effectiveFilter);
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      properties: properties.map((p) => this.mapToDto(p)),
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  public async updateProperty(
    tenantId: string,
    propertyId: string,
    currentUser: { id: string; role: Role; wardId?: string | null },
    dto: UpdatePropertyDto
  ): Promise<PropertyDto> {
    const existing = await this.repo.findPropertyById(tenantId, propertyId);
    if (!existing) {
      throw new NotFoundError('Property', propertyId);
    }

    // Allow-list Authorization:
    // Citizens can only edit their own properties
    if (currentUser.role === 'CITIZEN' && existing.userId !== currentUser.id) {
      throw new ForbiddenError('You do not have permission to update this property');
    }

    // Ward Officers can only edit properties within their own ward
    if (currentUser.role === 'WARD_OFFICER' && currentUser.wardId && existing.wardId !== currentUser.wardId) {
      throw new ForbiddenError('You can only update properties within your assigned ward');
    }

    // FIX 2: Ward and zone inconsistency fix:
    // If ward is changed and no new zone is provided, reset zone to null
    let targetZoneId = dto.zoneId;
    if (dto.wardId && dto.wardId !== existing.wardId && dto.zoneId === undefined) {
      targetZoneId = null;
    }

    const targetWardId = dto.wardId ?? existing.wardId;
    if (dto.wardId) {
      const wardExists = await this.repo.verifyWardExists(tenantId, dto.wardId);
      if (!wardExists) {
        throw new NotFoundError('Ward in this municipality', dto.wardId);
      }
    }

    if (targetZoneId) {
      const zoneExists = await this.repo.verifyZoneExists(tenantId, targetWardId, targetZoneId);
      if (!zoneExists) {
        throw new ValidationError({
          zoneId: ['The selected service zone does not exist or does not belong to the target ward'],
        });
      }
    }

    // FIX 3: Reset verification status on critical edit:
    // If citizen edits location (ward, street, lat/lng), reset to PENDING_VERIFICATION
    let statusUpdate: PropertyStatus | undefined = undefined;
    if (currentUser.role === 'CITIZEN') {
      const isLocationChanged =
        (dto.wardId && dto.wardId !== existing.wardId) ||
        (dto.streetAddress && dto.streetAddress !== existing.streetAddress) ||
        (dto.latitude !== undefined && dto.latitude !== existing.latitude) ||
        (dto.longitude !== undefined && dto.longitude !== existing.longitude);

      if (isLocationChanged && existing.status === PropertyStatus.ACTIVE) {
        statusUpdate = PropertyStatus.PENDING_VERIFICATION;
      }
    }

    const updated = await this.repo.updateProperty(tenantId, propertyId, {
      ...dto,
      zoneId: targetZoneId,
      ...(statusUpdate ? { status: statusUpdate } : {}),
    });

    return this.mapToDto(updated);
  }

  public async updatePropertyStatus(
    tenantId: string,
    propertyId: string,
    currentUser: { id: string; role: Role; wardId?: string | null },
    dto: UpdatePropertyStatusDto
  ): Promise<PropertyDto> {
    const existing = await this.repo.findPropertyById(tenantId, propertyId);
    if (!existing) {
      throw new NotFoundError('Property', propertyId);
    }

    // Ward officers can only verify properties in their own ward
    if (currentUser.role === 'WARD_OFFICER' && currentUser.wardId && existing.wardId !== currentUser.wardId) {
      throw new ForbiddenError('You can only verify properties in your assigned ward');
    }

    const updated = await this.repo.updateProperty(tenantId, propertyId, { status: dto.status });
    return this.mapToDto(updated);
  }

  private mapToDto(property: PropertyWithRelations): PropertyDto {
    return {
      id: property.id,
      tenantId: property.tenantId,
      wardId: property.wardId,
      wardNumber: property.ward.wardNumber,
      zoneId: property.zoneId,
      zoneName: property.zone?.name ?? null,
      userId: property.userId,
      propertyType: property.propertyType,
      status: property.status,
      houseNumber: property.houseNumber,
      streetAddress: property.streetAddress,
      latitude: property.latitude,
      longitude: property.longitude,
      qrCode: property.qrCode,
      contactName: property.contactName,
      contactPhone: property.contactPhone,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }
}
