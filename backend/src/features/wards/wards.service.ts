import { WardRepository } from './wards.repository.js';
import type {
  IWardRepository,
  WardDto,
  ZoneDto,
  WardWithRelations,
  ZoneWithRelations,
} from './wards.types.js';
import {
  CreateWardDto,
  UpdateWardDto,
  CreateZoneDto,
  UpdateZoneDto,
} from './wards.schema.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../shared/errors/app-error.js';
import { Role } from '@prisma/client';

export class WardService {
  constructor(private readonly repo: IWardRepository = new WardRepository()) {}

  public async getWards(tenantId: string): Promise<WardDto[]> {
    const wards = await this.repo.findWardsByTenant(tenantId);
    return wards.map((w) => this.mapWardToDto(w));
  }

  public async getWardById(tenantId: string, id: string): Promise<WardDto> {
    const ward = await this.repo.findWardById(tenantId, id);
    if (!ward) {
      throw new NotFoundError('Ward in this municipality', id);
    }
    return this.mapWardToDto(ward);
  }

  public async createWard(tenantId: string, dto: CreateWardDto): Promise<WardDto> {
    const existing = await this.repo.findWardByNumber(tenantId, dto.wardNumber);
    if (existing) {
      throw new ConflictError(`Ward number ${dto.wardNumber} already exists in this municipality`);
    }

    const ward = await this.repo.createWard({
      tenantId,
      wardNumber: dto.wardNumber,
      officeAddress: dto.officeAddress,
      contactPhone: dto.contactPhone,
    });

    return this.mapWardToDto(ward);
  }

  public async updateWard(tenantId: string, id: string, dto: UpdateWardDto): Promise<WardDto> {
    const exists = await this.repo.wardExists(tenantId, id);
    if (!exists) {
      throw new NotFoundError('Ward in this municipality', id);
    }

    const updated = await this.repo.updateWard(tenantId, id, dto);
    return this.mapWardToDto(updated);
  }

  public async getZonesByWard(
    tenantId: string,
    wardId: string,
    currentUser?: { role: Role; wardId?: string | null }
  ): Promise<ZoneDto[]> {
    const exists = await this.repo.wardExists(tenantId, wardId);
    if (!exists) {
      throw new NotFoundError('Ward in this municipality', wardId);
    }

    // Public / Citizen callers only get active zones; Staff get all zones
    const isStaff = currentUser && ([Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN, Role.WARD_OFFICER] as Role[]).includes(currentUser.role);
    const zones = await this.repo.findZonesByWard(tenantId, wardId, !isStaff);
    return zones.map((z) => this.mapZoneToDto(z));
  }

  public async createZone(
    tenantId: string,
    wardId: string,
    currentUser: { role: Role; wardId?: string | null },
    dto: CreateZoneDto
  ): Promise<ZoneDto> {
    // Ward Officers can only create zones in their assigned ward
    if (currentUser.role === Role.WARD_OFFICER && currentUser.wardId && currentUser.wardId !== wardId) {
      throw new ForbiddenError('You can only create service zones in your assigned ward');
    }

    const exists = await this.repo.wardExists(tenantId, wardId);
    if (!exists) {
      throw new NotFoundError('Ward in this municipality', wardId);
    }

    const existingCode = await this.repo.findZoneByCode(tenantId, wardId, dto.code);
    if (existingCode) {
      throw new ConflictError(`Zone with code '${dto.code}' already exists in this ward`);
    }

    const zone = await this.repo.createZone({
      tenantId,
      wardId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
    });

    return this.mapZoneToDto(zone);
  }

  public async updateZone(
    tenantId: string,
    id: string,
    currentUser: { role: Role; wardId?: string | null },
    dto: UpdateZoneDto
  ): Promise<ZoneDto> {
    const existing = await this.repo.findZoneById(tenantId, id);
    if (!existing) {
      throw new NotFoundError('Service zone', id);
    }

    // Ward Officers can only update zones in their assigned ward
    if (currentUser.role === Role.WARD_OFFICER && currentUser.wardId && existing.wardId !== currentUser.wardId) {
      throw new ForbiddenError('You can only update service zones in your assigned ward');
    }

    const updated = await this.repo.updateZone(tenantId, id, dto);
    return this.mapZoneToDto(updated);
  }

  private mapWardToDto(ward: WardWithRelations): WardDto {
    return {
      id: ward.id,
      tenantId: ward.tenantId,
      wardNumber: ward.wardNumber,
      officeAddress: ward.officeAddress,
      contactPhone: ward.contactPhone,
      createdAt: ward.createdAt,
      updatedAt: ward.updatedAt,
      zoneCount: ward._count?.serviceZones ?? 0,
      propertyCount: ward._count?.properties ?? 0,
    };
  }

  private mapZoneToDto(zone: ZoneWithRelations): ZoneDto {
    return {
      id: zone.id,
      tenantId: zone.tenantId,
      wardId: zone.wardId,
      name: zone.name,
      code: zone.code,
      description: zone.description,
      isActive: zone.isActive,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
      propertyCount: zone._count?.properties ?? 0,
    };
  }
}
