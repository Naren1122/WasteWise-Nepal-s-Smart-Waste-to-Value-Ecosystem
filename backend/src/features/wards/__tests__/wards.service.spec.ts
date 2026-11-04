import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WardService } from '../wards.service.js';
import type { IWardRepository, WardWithRelations, ZoneWithRelations } from '../wards.types.js';
import { Role } from '@prisma/client';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../shared/errors/app-error.js';

describe('WardService Operations & Security', () => {
  let wardService: WardService;
  let mockRepo: Record<string, ReturnType<typeof vi.fn>>;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockWardId = '22222222-2222-2222-2222-222222222222';
  const mockZoneId = '33333333-3333-3333-3333-333333333333';

  const mockWardRecord: WardWithRelations = {
    id: mockWardId,
    tenantId: mockTenantId,
    wardNumber: 4,
    officeAddress: 'Baluwatar, Kathmandu',
    contactPhone: '+977-01-4435678',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      serviceZones: 2,
      properties: 15,
    },
  };

  const mockZoneRecord: ZoneWithRelations = {
    id: mockZoneId,
    tenantId: mockTenantId,
    wardId: mockWardId,
    name: 'Baluwatar Chowk',
    code: 'BAL-01',
    description: 'Central Baluwatar residential area',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      properties: 5,
    },
  };

  beforeEach(() => {
    mockRepo = {
      findWardsByTenant: vi.fn(),
      findWardById: vi.fn(),
      findWardByNumber: vi.fn(),
      createWard: vi.fn(),
      updateWard: vi.fn(),
      wardExists: vi.fn(),
      findZonesByWard: vi.fn(),
      findZoneById: vi.fn(),
      findZoneByCode: vi.fn(),
      createZone: vi.fn(),
      updateZone: vi.fn(),
    };

    wardService = new WardService(mockRepo as unknown as IWardRepository);
  });

  describe('createWard', () => {
    it('should create a new municipal ward when the ward number is unique', async () => {
      mockRepo.findWardByNumber.mockResolvedValue(null);
      mockRepo.createWard.mockResolvedValue(mockWardRecord);

      const result = await wardService.createWard(mockTenantId, {
        wardNumber: 4,
        officeAddress: 'Baluwatar, Kathmandu',
        contactPhone: '+977-01-4435678',
      });

      expect(mockRepo.findWardByNumber).toHaveBeenCalledWith(mockTenantId, 4);
      expect(result.wardNumber).toBe(4);
      expect(result.zoneCount).toBe(2);
      expect(result.propertyCount).toBe(15);
    });

    it('should throw ConflictError if ward number already exists in this municipality', async () => {
      mockRepo.findWardByNumber.mockResolvedValue(mockWardRecord);

      await expect(
        wardService.createWard(mockTenantId, {
          wardNumber: 4,
          officeAddress: 'Duplicate Ward 4',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('createZone & Ward Officer Scoping', () => {
    it('should allow Municipal Admin to create a zone in any ward', async () => {
      mockRepo.wardExists.mockResolvedValue(true);
      mockRepo.findZoneByCode.mockResolvedValue(null);
      mockRepo.createZone.mockResolvedValue(mockZoneRecord);

      const result = await wardService.createZone(
        mockTenantId,
        mockWardId,
        { role: Role.MUNICIPAL_ADMIN },
        { name: 'Baluwatar Chowk', code: 'BAL-01' }
      );

      expect(result.code).toBe('BAL-01');
      expect(result.name).toBe('Baluwatar Chowk');
    });

    it('should forbid Ward Officer from creating a zone in a ward they are not assigned to', async () => {
      await expect(
        wardService.createZone(
          mockTenantId,
          mockWardId, // target ward is mockWardId
          { role: Role.WARD_OFFICER, wardId: 'different-ward-assigned-id' },
          { name: 'Foreign Zone', code: 'FOR-01' }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ConflictError if a zone with the same code exists in the ward', async () => {
      mockRepo.wardExists.mockResolvedValue(true);
      mockRepo.findZoneByCode.mockResolvedValue(mockZoneRecord);

      await expect(
        wardService.createZone(
          mockTenantId,
          mockWardId,
          { role: Role.MUNICIPAL_ADMIN },
          { name: 'Duplicate Zone Code', code: 'BAL-01' }
        )
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getZonesByWard', () => {
    it('should throw NotFoundError if the requested ward does not exist', async () => {
      mockRepo.wardExists.mockResolvedValue(false);

      await expect(
        wardService.getZonesByWard(mockTenantId, 'non-existent-ward-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should return zones when ward exists', async () => {
      mockRepo.wardExists.mockResolvedValue(true);
      mockRepo.findZonesByWard.mockResolvedValue([mockZoneRecord]);

      const result = await wardService.getZonesByWard(mockTenantId, mockWardId);
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('BAL-01');
    });
  });
});
