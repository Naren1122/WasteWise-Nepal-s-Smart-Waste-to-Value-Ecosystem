import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FleetService } from '../fleet.service.js';
import type { IFleetRepository, VehicleWithRelations } from '../fleet.types.js';
import { VehicleType, VehicleStatus } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors/app-error.js';

describe('FleetService', () => {
  let mockRepo: IFleetRepository;
  let service: FleetService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const vehicleId = '00000000-0000-0000-0000-000000000002';
  const driverId = '00000000-0000-0000-0000-000000000003';

  const mockVehicle: VehicleWithRelations = {
    id: vehicleId,
    tenantId,
    registrationNo: 'BA 1 JA 1234',
    vehicleType: VehicleType.COMPACTOR,
    capacityKg: 5000,
    fuelType: 'DIESEL',
    status: VehicleStatus.AVAILABLE,
    assignedDriverId: driverId,
    notes: 'Primary Ward 1 compactor',
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedDriver: {
      id: driverId,
      fullName: 'Ram Bahadur',
      phone: '+9779851000003',
      email: 'driver1@kathmandu.gov.np',
    },
    _count: { routes: 0 },
  };

  beforeEach(() => {
    mockRepo = {
      createVehicle: vi.fn(),
      findVehicleById: vi.fn(),
      findVehicleByRegNo: vi.fn(),
      findVehicles: vi.fn(),
      updateVehicle: vi.fn(),
      deleteVehicle: vi.fn(),
      findEligibleDrivers: vi.fn(),
    };
    service = new FleetService(mockRepo);
  });

  describe('createVehicle', () => {
    it('should throw ConflictError if registration number already exists', async () => {
      vi.mocked(mockRepo.findVehicleByRegNo).mockResolvedValue(mockVehicle);

      await expect(
        service.createVehicle(tenantId, {
          registrationNo: 'BA 1 JA 1234',
          vehicleType: VehicleType.COMPACTOR,
          capacityKg: 5000,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if assigned driver is not eligible', async () => {
      vi.mocked(mockRepo.findVehicleByRegNo).mockResolvedValue(null);
      vi.mocked(mockRepo.findEligibleDrivers).mockResolvedValue([]);

      await expect(
        service.createVehicle(tenantId, {
          registrationNo: 'BA 1 JA 1234',
          vehicleType: VehicleType.COMPACTOR,
          capacityKg: 5000,
          assignedDriverId: driverId,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should create and return vehicle dto successfully', async () => {
      vi.mocked(mockRepo.findVehicleByRegNo).mockResolvedValue(null);
      vi.mocked(mockRepo.findEligibleDrivers).mockResolvedValue([
        { id: driverId, fullName: 'Ram Bahadur', phone: '+9779851000003', email: 'driver1@kathmandu.gov.np' },
      ]);
      vi.mocked(mockRepo.createVehicle).mockResolvedValue(mockVehicle);

      const result = await service.createVehicle(tenantId, {
        registrationNo: 'BA 1 JA 1234',
        vehicleType: VehicleType.COMPACTOR,
        capacityKg: 5000,
        assignedDriverId: driverId,
      });

      expect(result.id).toBe(vehicleId);
      expect(result.registrationNo).toBe('BA 1 JA 1234');
      expect(result.assignedDriver?.fullName).toBe('Ram Bahadur');
    });
  });

  describe('getVehicleById', () => {
    it('should throw NotFoundError if vehicle does not exist', async () => {
      vi.mocked(mockRepo.findVehicleById).mockResolvedValue(null);

      await expect(service.getVehicleById(tenantId, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should return vehicle dto when found', async () => {
      vi.mocked(mockRepo.findVehicleById).mockResolvedValue(mockVehicle);

      const result = await service.getVehicleById(tenantId, vehicleId);
      expect(result.id).toBe(vehicleId);
      expect(result.status).toBe(VehicleStatus.AVAILABLE);
    });
  });

  describe('deleteVehicle', () => {
    it('should throw ConflictError if vehicle has route dispatch history', async () => {
      const vehicleWithRoutes: VehicleWithRelations = {
        ...mockVehicle,
        _count: { routes: 5 },
      };
      vi.mocked(mockRepo.findVehicleById).mockResolvedValue(vehicleWithRoutes);

      await expect(service.deleteVehicle(tenantId, vehicleId)).rejects.toThrow(ConflictError);
    });

    it('should delete vehicle if it has no routes', async () => {
      vi.mocked(mockRepo.findVehicleById).mockResolvedValue(mockVehicle);
      vi.mocked(mockRepo.deleteVehicle).mockResolvedValue();

      await service.deleteVehicle(tenantId, vehicleId);
      expect(mockRepo.deleteVehicle).toHaveBeenCalledWith(tenantId, vehicleId);
    });
  });
});

