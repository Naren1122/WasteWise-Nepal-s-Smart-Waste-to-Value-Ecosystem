import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingController } from '../tracking.controller.js';
import { TrackingService } from '../tracking.service.js';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';

describe('TrackingController', () => {
  let controller: TrackingController;
  let mockService: TrackingService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000002';
  const routeId = '00000000-0000-0000-0000-000000000003';
  const wardId = '00000000-0000-0000-0000-000000000004';

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = {
      ingestLocation: vi.fn(),
      getActiveFleetPositions: vi.fn(),
      getRouteBreadcrumbs: vi.fn().mockResolvedValue([]),
    } as unknown as TrackingService;

    controller = new TrackingController(mockService);
  });

  describe('getRouteBreadcrumbs (Regression test for Issue #1)', () => {
    it('should forward limit and wardId correctly in options object to TrackingService', async () => {
      const req = {
        tenant: { id: tenantId },
        user: {
          id: userId,
          role: Role.WARD_OFFICER,
          wardId: wardId,
        },
        params: { routeId },
        query: { limit: '25' },
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.getRouteBreadcrumbs(req, res);

      // Verify that options object was passed with correct property mappings (not swapped)
      expect(mockService.getRouteBreadcrumbs).toHaveBeenCalledWith({
        tenantId,
        routeId,
        userId,
        role: Role.WARD_OFFICER,
        wardId,
        limit: 25,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
        })
      );
    });
  });
});

