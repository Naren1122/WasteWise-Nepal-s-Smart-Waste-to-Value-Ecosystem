import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlansService } from '../plans.service.js';
import type { IPlansRepository } from '../plans.types.js';
import type { IPropertyRepository } from '../../properties/properties.types.js';
import { Role, PropertyType, WasteType } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from '../../../shared/errors/app-error.js';

describe('PlansService', () => {
  let mockRepo: IPlansRepository;
  let mockPropertyRepo: IPropertyRepository;
  let service: PlansService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000002';
  const propertyId = '00000000-0000-0000-0000-000000000003';
  const planId = '00000000-0000-0000-0000-000000000004';

  const mockPlan = {
    id: planId,
    tenantId,
    name: 'Residential Organic Plan',
    code: 'RES_ORG_01',
    description: 'Weekly organic collection',
    propertyType: PropertyType.RESIDENTIAL,
    wasteType: WasteType.ORGANIC,
    monthlyRateNpr: 350,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { subscriptions: 0 },
  };

  const mockProperty = {
    id: propertyId,
    tenantId,
    wardId: '00000000-0000-0000-0000-000000000005',
    zoneId: null,
    userId,
    propertyType: PropertyType.RESIDENTIAL,
    status: 'ACTIVE' as const,
    houseNumber: '12B',
    streetAddress: 'Baluwatar Road',
    latitude: 27.7172,
    longitude: 85.324,
    qrCode: null,
    contactName: 'Ram Sharma',
    contactPhone: '+9779841000000',
    createdAt: new Date(),
    updatedAt: new Date(),
    ward: { wardNumber: 4 },
    zone: null,
  };

  beforeEach(() => {
    mockRepo = {
      createPlan: vi.fn(),
      findPlanById: vi.fn(),
      findPlanByCode: vi.fn(),
      findPlans: vi.fn(),
      updatePlan: vi.fn(),
      createSubscription: vi.fn(),
      findSubscriptionById: vi.fn(),
      findSubscriptionsByProperty: vi.fn(),
      findActiveSubscription: vi.fn(),
      cancelSubscription: vi.fn(),
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

    service = new PlansService(mockRepo, mockPropertyRepo);
  });

  it('should successfully create a new service plan when code is unique', async () => {
    vi.mocked(mockRepo.findPlanByCode).mockResolvedValue(null);
    vi.mocked(mockRepo.createPlan).mockResolvedValue(mockPlan);

    const result = await service.createPlan(tenantId, {
      name: 'Residential Organic Plan',
      code: 'RES_ORG_01',
      description: 'Weekly organic collection',
      propertyType: PropertyType.RESIDENTIAL,
      wasteType: WasteType.ORGANIC,
      monthlyRateNpr: 350,
    });

    expect(result.code).toBe('RES_ORG_01');
    expect(result.monthlyRateNpr).toBe(350);
    expect(mockRepo.createPlan).toHaveBeenCalledOnce();
  });

  it('should throw ConflictError if plan code already exists in tenant', async () => {
    vi.mocked(mockRepo.findPlanByCode).mockResolvedValue(mockPlan);

    await expect(
      service.createPlan(tenantId, {
        name: 'Another Plan',
        code: 'RES_ORG_01',
        propertyType: PropertyType.RESIDENTIAL,
        wasteType: WasteType.ORGANIC,
        monthlyRateNpr: 400,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should successfully create subscription when property and plan match', async () => {
    vi.mocked(mockPropertyRepo.findPropertyById).mockResolvedValue(mockProperty);
    vi.mocked(mockRepo.findPlanById).mockResolvedValue(mockPlan);
    vi.mocked(mockRepo.findActiveSubscription).mockResolvedValue(null);

    const mockSub = {
      id: 'sub-01',
      tenantId,
      propertyId,
      planId,
      userId,
      status: 'ACTIVE' as const,
      startDate: new Date(),
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: mockPlan,
      property: {
        id: propertyId,
        streetAddress: 'Baluwatar Road',
        houseNumber: '12B',
        propertyType: PropertyType.RESIDENTIAL,
        ward: { wardNumber: 4 },
      },
      user: {
        id: userId,
        fullName: 'Ram Sharma',
        email: 'ram@example.com',
        phone: '+9779841000000',
      },
    };
    vi.mocked(mockRepo.createSubscription).mockResolvedValue(mockSub);

    const result = await service.createSubscription(tenantId, userId, Role.CITIZEN, {
      propertyId,
      planId,
    });

    expect(result.id).toBe('sub-01');
    expect(result.status).toBe('ACTIVE');
  });

  it('should prevent citizen from subscribing for another user property', async () => {
    vi.mocked(mockPropertyRepo.findPropertyById).mockResolvedValue(mockProperty);

    await expect(
      service.createSubscription(tenantId, 'different-user-id', Role.CITIZEN, {
        propertyId,
        planId,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw ValidationError if plan propertyType does not match property', async () => {
    vi.mocked(mockPropertyRepo.findPropertyById).mockResolvedValue({
      ...mockProperty,
      propertyType: PropertyType.COMMERCIAL,
    });
    vi.mocked(mockRepo.findPlanById).mockResolvedValue(mockPlan);

    await expect(
      service.createSubscription(tenantId, userId, Role.CITIZEN, {
        propertyId,
        planId,
      })
    ).rejects.toThrow(ValidationError);
  });
});

