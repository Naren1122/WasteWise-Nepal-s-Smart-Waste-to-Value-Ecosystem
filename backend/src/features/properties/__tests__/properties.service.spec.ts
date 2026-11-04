import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertyService } from '../properties.service.js';
import type { IPropertyRepository, PropertyWithRelations } from '../properties.types.js';
import { PropertyType, PropertyStatus, Role } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/errors/app-error.js';

describe('PropertyService Unit & Security Operations', () => {
  let propertyService: PropertyService;
  let mockRepo: Record<string, ReturnType<typeof vi.fn>>;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockWardId = '33333333-3333-3333-3333-333333333333';
  const mockZoneId = '44444444-4444-4444-4444-444444444444';
  const mockPropertyId = '55555555-5555-5555-5555-555555555555';

  const mockPropertyRecord: PropertyWithRelations = {
    id: mockPropertyId,
    tenantId: mockTenantId,
    userId: mockUserId,
    wardId: mockWardId,
    zoneId: mockZoneId,
    propertyType: PropertyType.RESIDENTIAL,
    status: PropertyStatus.PENDING_VERIFICATION,
    houseNumber: '45/B',
    streetAddress: 'Baluwatar Marg, Kathmandu',
    latitude: 27.7215,
    longitude: 85.3312,
    qrCode: null,
    contactName: 'Ram Bahadur',
    contactPhone: '+9779841234567',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ward: { wardNumber: 4 },
    zone: { name: 'Baluwatar Chowk' },
  };

  beforeEach(() => {
    mockRepo = {
      createProperty: vi.fn(),
      findPropertyById: vi.fn(),
      findPropertiesByUserId: vi.fn(),
      findProperties: vi.fn(),
      updateProperty: vi.fn(),
      deleteProperty: vi.fn(),
      verifyWardExists: vi.fn(),
      verifyZoneExists: vi.fn(),
    };

    propertyService = new PropertyService(mockRepo as unknown as IPropertyRepository);
  });

  describe('registerProperty', () => {
    it('should successfully register a premises when ward and zone are valid', async () => {
      mockRepo.verifyWardExists.mockResolvedValue(true);
      mockRepo.verifyZoneExists.mockResolvedValue(true);
      mockRepo.createProperty.mockResolvedValue(mockPropertyRecord);

      const result = await propertyService.registerProperty(mockTenantId, mockUserId, {
        wardId: mockWardId,
        zoneId: mockZoneId,
        propertyType: PropertyType.RESIDENTIAL,
        houseNumber: '45/B',
        streetAddress: 'Baluwatar Marg, Kathmandu',
        latitude: 27.7215,
        longitude: 85.3312,
        contactName: 'Ram Bahadur',
        contactPhone: '+9779841234567',
      });

      expect(mockRepo.verifyWardExists).toHaveBeenCalledWith(mockTenantId, mockWardId);
      expect(mockRepo.verifyZoneExists).toHaveBeenCalledWith(mockTenantId, mockWardId, mockZoneId);
      expect(result.id).toBe(mockPropertyId);
      expect(result.status).toBe(PropertyStatus.PENDING_VERIFICATION);
      expect(result.wardNumber).toBe(4);
    });

    it('should throw NotFoundError if the designated ward does not exist in the tenant', async () => {
      mockRepo.verifyWardExists.mockResolvedValue(false);

      await expect(
        propertyService.registerProperty(mockTenantId, mockUserId, {
          wardId: mockWardId,
          propertyType: PropertyType.RESIDENTIAL,
          streetAddress: 'Invalid Ward Street',
          latitude: 27.72,
          longitude: 85.33,
          contactName: 'Ram',
          contactPhone: '+9779841234567',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if the selected zone does not belong to the ward', async () => {
      mockRepo.verifyWardExists.mockResolvedValue(true);
      mockRepo.verifyZoneExists.mockResolvedValue(false);

      await expect(
        propertyService.registerProperty(mockTenantId, mockUserId, {
          wardId: mockWardId,
          zoneId: mockZoneId,
          propertyType: PropertyType.RESIDENTIAL,
          streetAddress: 'Baluwatar Marg',
          latitude: 27.72,
          longitude: 85.33,
          contactName: 'Ram',
          contactPhone: '+9779841234567',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getPropertyById & Authorization Boundary', () => {
    it('should allow property owner to view their property', async () => {
      mockRepo.findPropertyById.mockResolvedValue(mockPropertyRecord);

      const result = await propertyService.getPropertyById(mockTenantId, mockPropertyId, {
        id: mockUserId,
        role: Role.CITIZEN,
      });

      expect(result.id).toBe(mockPropertyId);
    });

    it('should forbid other citizens from viewing a property they do not own', async () => {
      mockRepo.findPropertyById.mockResolvedValue(mockPropertyRecord);

      await expect(
        propertyService.getPropertyById(mockTenantId, mockPropertyId, {
          id: 'unauthorized-user-id',
          role: Role.CITIZEN,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow municipal admin to view any property in their tenant', async () => {
      mockRepo.findPropertyById.mockResolvedValue(mockPropertyRecord);

      const result = await propertyService.getPropertyById(mockTenantId, mockPropertyId, {
        id: 'admin-user-id',
        role: Role.MUNICIPAL_ADMIN,
      });

      expect(result.id).toBe(mockPropertyId);
    });
  });

  describe('updatePropertyStatus (Admin Verification)', () => {
    it('should allow Municipal Admin to verify and activate a premises', async () => {
      mockRepo.findPropertyById.mockResolvedValue(mockPropertyRecord);
      mockRepo.updateProperty.mockResolvedValue({
        ...mockPropertyRecord,
        status: PropertyStatus.ACTIVE,
      });

      const result = await propertyService.updatePropertyStatus(
        mockTenantId,
        mockPropertyId,
        { id: 'admin-id', role: Role.MUNICIPAL_ADMIN },
        { status: PropertyStatus.ACTIVE, verificationNotes: 'Ward inspection confirmed' }
      );

      expect(result.status).toBe(PropertyStatus.ACTIVE);
      expect(mockRepo.updateProperty).toHaveBeenCalled();
    });

    it('should block Citizens from verifying or changing property status', async () => {
      mockRepo.findPropertyById.mockResolvedValue(mockPropertyRecord);

      await expect(
        propertyService.updatePropertyStatus(
          mockTenantId,
          mockPropertyId,
          { id: mockUserId, role: Role.CITIZEN },
          { status: PropertyStatus.ACTIVE }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should block Ward Officer from verifying properties belonging to a different ward', async () => {
      mockRepo.findPropertyById.mockResolvedValue(mockPropertyRecord); // wardId is mockWardId

      await expect(
        propertyService.updatePropertyStatus(
          mockTenantId,
          mockPropertyId,
          { id: 'ward-officer-id', role: Role.WARD_OFFICER, wardId: 'different-ward-id' },
          { status: PropertyStatus.ACTIVE }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
