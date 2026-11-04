import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkyWasteService } from '../bulky-waste.service.js';
import type { IBulkyWasteRepository, BulkyRequestWithRelations } from '../bulky-waste.types.js';
import type { IPropertyRepository } from '../../properties/properties.types.js';
import { Role, PropertyType, BulkyWasteStatus } from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors/app-error.js';

describe('BulkyWasteService', () => {
  let mockRepo: IBulkyWasteRepository;
  let mockPropertyRepo: IPropertyRepository;
  let service: BulkyWasteService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000002';
  const otherUserId = '00000000-0000-0000-0000-000000000099';
  const propertyId = '00000000-0000-0000-0000-000000000003';
  const requestId = '00000000-0000-0000-0000-000000000004';
  const wardId = '00000000-0000-0000-0000-000000000005';
  const otherWardId = '00000000-0000-0000-0000-000000000006';

  const mockProperty = {
    id: propertyId,
    tenantId,
    wardId,
    zoneId: null,
    userId,
    propertyType: PropertyType.RESIDENTIAL,
    status: 'ACTIVE' as const,
    houseNumber: '44',
    streetAddress: 'Lazimpat',
    latitude: 27.72,
    longitude: 85.32,
    qrCode: null,
    contactName: 'Sita',
    contactPhone: '+9779841222222',
    createdAt: new Date(),
    updatedAt: new Date(),
    ward: { wardNumber: 3 },
    zone: null,
  };

  const mockRequest: BulkyRequestWithRelations = {
    id: requestId,
    tenantId,
    propertyId,
    userId,
    itemDescription: 'Old wooden sofa and 2 armchairs',
    estimatedVolume: '2 cubic meters',
    preferredDate: new Date('2026-11-15T00:00:00.000Z'),
    scheduledDate: null,
    status: BulkyWasteStatus.SUBMITTED,
    quotedAmountNpr: null,
    officerNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    property: {
      id: propertyId,
      streetAddress: 'Lazimpat',
      houseNumber: '44',
      wardId,
      ward: { wardNumber: 3 },
    },
    user: {
      id: userId,
      fullName: 'Sita',
      phone: '+9779841222222',
      email: 'sita@example.com',
    },
  };

  beforeEach(() => {
    mockRepo = {
      createRequest: vi.fn(),
      findRequestById: vi.fn(),
      findRequests: vi.fn(),
      transitionStatus: vi.fn(),
    };

    mockPropertyRepo = {
      createProperty: vi.fn(),
      findPropertyById: vi.fn(),
      findPropertiesByUserId: vi.fn(),
      findProperties: vi.fn(),
      updateProperty: vi.fn(),
      deleteProperty: vi.fn(),
      verifyWardExists: vi.fn(),
      verifyZoneExists: vi.fn(),
    };

    service = new BulkyWasteService(mockRepo, mockPropertyRepo);
  });

  describe('submitRequest', () => {
    it('should allow citizen to submit a bulky waste request for own property', async () => {
      vi.mocked(mockPropertyRepo.findPropertyById).mockResolvedValue(mockProperty);
      vi.mocked(mockRepo.createRequest).mockResolvedValue(mockRequest);

      const result = await service.submitRequest(tenantId, userId, Role.CITIZEN, {
        propertyId,
        itemDescription: 'Old wooden sofa and 2 armchairs',
        preferredDate: new Date('2026-11-15T00:00:00.000Z'),
      });

      expect(result.status).toBe(BulkyWasteStatus.SUBMITTED);
      expect(result.itemDescription).toBe('Old wooden sofa and 2 armchairs');
      expect(mockRepo.createRequest).toHaveBeenCalledWith(
        expect.objectContaining({ userId })
      );
    });

    it('should assign request ownership to property owner when municipal admin submits', async () => {
      vi.mocked(mockPropertyRepo.findPropertyById).mockResolvedValue(mockProperty);
      vi.mocked(mockRepo.createRequest).mockResolvedValue(mockRequest);

      const adminId = 'admin-user-id';
      await service.submitRequest(tenantId, adminId, Role.MUNICIPAL_ADMIN, {
        propertyId,
        itemDescription: 'Street tree trimmings',
        preferredDate: new Date('2026-11-15T00:00:00.000Z'),
      });

      expect(mockRepo.createRequest).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockProperty.userId })
      );
    });

    it('should disallow citizen from submitting request for another user property', async () => {
      vi.mocked(mockPropertyRepo.findPropertyById).mockResolvedValue(mockProperty);

      await expect(
        service.submitRequest(tenantId, otherUserId, Role.CITIZEN, {
          propertyId,
          itemDescription: 'Old sofa',
          preferredDate: new Date('2026-11-15T00:00:00.000Z'),
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('IDOR & Ward Scoping Security', () => {
    it('should return 404 NotFoundError if citizen requests another citizen request (IDOR prevention)', async () => {
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(mockRequest);

      await expect(
        service.getRequestById(tenantId, requestId, otherUserId, Role.CITIZEN)
      ).rejects.toThrow(NotFoundError);
    });

    it('should return 404 NotFoundError if ward officer requests bulky request outside their assigned ward', async () => {
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(mockRequest);

      await expect(
        service.getRequestById(tenantId, requestId, 'officer-id', Role.WARD_OFFICER, otherWardId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should allow municipal admin to view any bulky request in tenant', async () => {
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(mockRequest);

      const result = await service.getRequestById(tenantId, requestId, 'admin-id', Role.MUNICIPAL_ADMIN);
      expect(result.id).toBe(requestId);
    });
  });

  describe('State Transitions & Concurrency', () => {
    it('should advance request from SUBMITTED to QUOTED when officer provides quote', async () => {
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(mockRequest);
      vi.mocked(mockRepo.transitionStatus).mockResolvedValue({
        ...mockRequest,
        status: BulkyWasteStatus.QUOTED,
        quotedAmountNpr: 1500 as unknown as import('@prisma/client/runtime/library.js').Decimal,
        officerNotes: 'Standard municipal fee',
      });

      const result = await service.quoteRequest(tenantId, requestId, {
        quotedAmountNpr: 1500,
        officerNotes: 'Standard municipal fee',
      });

      expect(result.status).toBe(BulkyWasteStatus.QUOTED);
      expect(result.quotedAmountNpr).toBe(1500);
      expect(mockRepo.transitionStatus).toHaveBeenCalledWith(
        tenantId,
        requestId,
        [BulkyWasteStatus.SUBMITTED, BulkyWasteStatus.QUOTED],
        BulkyWasteStatus.QUOTED,
        expect.objectContaining({ quotedAmountNpr: 1500 })
      );
    });

    it('should advance request from QUOTED to APPROVED by citizen owner', async () => {
      const quotedRequest: BulkyRequestWithRelations = {
        ...mockRequest,
        status: BulkyWasteStatus.QUOTED,
        quotedAmountNpr: 1500 as unknown as import('@prisma/client/runtime/library.js').Decimal,
      };
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(quotedRequest);
      vi.mocked(mockRepo.transitionStatus).mockResolvedValue({
        ...quotedRequest,
        status: BulkyWasteStatus.APPROVED,
      });

      const result = await service.approveQuotation(tenantId, requestId, userId, Role.CITIZEN);
      expect(result.status).toBe(BulkyWasteStatus.APPROVED);
    });

    it('should throw ConflictError (409) if scheduling unapproved request', async () => {
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(mockRequest); // still SUBMITTED

      await expect(
        service.schedulePickup(tenantId, requestId, {
          scheduledDate: new Date('2026-11-20T00:00:00.000Z'),
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError (409) when concurrent write race occurs (transitionStatus returns null)', async () => {
      const quotedRequest: BulkyRequestWithRelations = {
        ...mockRequest,
        status: BulkyWasteStatus.QUOTED,
      };
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(quotedRequest);
      // Simulate another concurrent caller already transitioned the state
      vi.mocked(mockRepo.transitionStatus).mockResolvedValue(null);

      await expect(
        service.approveQuotation(tenantId, requestId, userId, Role.CITIZEN)
      ).rejects.toThrow(ConflictError);
    });

    it('should allow officer to reject request from SUBMITTED status', async () => {
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(mockRequest);
      vi.mocked(mockRepo.transitionStatus).mockResolvedValue({
        ...mockRequest,
        status: BulkyWasteStatus.REJECTED,
        officerNotes: 'Non-compliant hazardous industrial items',
      });

      const result = await service.rejectRequest(tenantId, requestId, {
        officerNotes: 'Non-compliant hazardous industrial items',
      });

      expect(result.status).toBe(BulkyWasteStatus.REJECTED);
    });

    it('should allow completing a SCHEDULED request', async () => {
      const scheduledRequest: BulkyRequestWithRelations = {
        ...mockRequest,
        status: BulkyWasteStatus.SCHEDULED,
      };
      vi.mocked(mockRepo.findRequestById).mockResolvedValue(scheduledRequest);
      vi.mocked(mockRepo.transitionStatus).mockResolvedValue({
        ...scheduledRequest,
        status: BulkyWasteStatus.COMPLETED,
        officerNotes: 'Dumped at Sisdole landfill',
      });

      const result = await service.completeRequest(tenantId, requestId, {
        officerNotes: 'Dumped at Sisdole landfill',
      });

      expect(result.status).toBe(BulkyWasteStatus.COMPLETED);
    });
  });
});
