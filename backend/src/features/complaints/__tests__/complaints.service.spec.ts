import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplaintsService } from '../complaints.service.js';
import type { IComplaintsRepository } from '../complaints.repository.js';
import type { ComplaintDetailDto, LodgeComplaintDto } from '../complaints.types.js';
import { Role } from '@prisma/client';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
} from '../../../shared/errors/app-error.js';
import type { UserContext } from '../../../shared/types/user-context.types.js';

describe('ComplaintsService', () => {
  let mockRepo: IComplaintsRepository;
  let service: ComplaintsService;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const citizenId = '22222222-2222-2222-2222-222222222222';
  const otherCitizenId = '33333333-3333-3333-3333-333333333333';
  const wardId = '44444444-4444-4444-4444-444444444444';
  const otherWardId = '55555555-5555-5555-5555-555555555555';
  const complaintId = '66666666-6666-6666-6666-666666666666';

  const citizenUser: UserContext = {
    id: citizenId,
    tenantId,
    role: Role.CITIZEN,
    email: 'citizen@example.com',
    wardId,
  };

  const wardOfficerUser: UserContext = {
    id: '77777777-7777-7777-7777-777777777777',
    tenantId,
    role: Role.WARD_OFFICER,
    email: 'officer@example.com',
    wardId,
  };

  const fieldWorkerUser: UserContext = {
    id: '88888888-8888-8888-8888-888888888888',
    tenantId,
    role: Role.FIELD_WORKER,
    email: 'worker@example.com',
    wardId,
  };

  const baseComplaint: ComplaintDetailDto = {
    id: complaintId,
    tenantId,
    ticketNumber: 'WW-GRV-2611-1001',
    wardId,
    wardNumber: 4,
    citizenId,
    citizenName: 'Hari Prasad',
    citizenPhone: '+9779841234567',
    assignedToId: null,
    assignedToName: null,
    category: 'ILLEGAL_DUMPING',
    priority: 'MEDIUM',
    status: 'SUBMITTED',
    title: 'Garbage dumped near junction',
    description: 'Large pile of plastic and organic waste',
    latitude: 27.7172,
    longitude: 85.324,
    addressText: 'Lazimpat, Kathmandu',
    slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
    isSlaBreached: false,
    rejectionReason: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: [],
    timelines: [],
    feedback: null,
    subscriberCount: 0,
  };

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockResolvedValue(baseComplaint),
      findCandidateDuplicates: vi.fn().mockResolvedValue([]),
      addSubscriber: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(baseComplaint),
      findByTicketNumber: vi.fn().mockResolvedValue(baseComplaint),
      findMany: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false } }),
      updateTriage: vi.fn().mockResolvedValue({ ...baseComplaint, status: 'UNDER_REVIEW' }),
      resolve: vi.fn().mockResolvedValue({ ...baseComplaint, status: 'RESOLVED', resolvedAt: new Date() }),
      reopen: vi.fn().mockResolvedValue({ ...baseComplaint, status: 'REOPENED', resolvedAt: null }),
      addFeedback: vi.fn().mockResolvedValue(undefined),
    };
    service = new ComplaintsService(mockRepo);
  });

  describe('Anti-Duplicate Clustering & Lodging', () => {
    it('should create a new complaint when no candidate duplicates exist nearby', async () => {
      const payload: LodgeComplaintDto = {
        wardId,
        category: 'ILLEGAL_DUMPING',
        title: 'Dumping on corner',
        description: 'Piles of waste accumulating',
        latitude: 27.7172,
        longitude: 85.324,
      };

      const result = await service.lodgeComplaint(tenantId, citizenId, payload);
      expect(result.isDuplicate).toBe(false);
      if (!result.isDuplicate) {
        expect(result.complaint.ticketNumber).toBe('WW-GRV-2611-1001');
      }
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should cluster and link citizen as subscriber when an active dumping complaint is within 50m', async () => {
      // Coordinate approximately 20 meters away
      vi.mocked(mockRepo.findCandidateDuplicates).mockResolvedValueOnce([
        {
          id: complaintId,
          ticketNumber: 'WW-GRV-2611-1001',
          latitude: 27.717205,
          longitude: 85.324005,
        },
      ]);

      const payload: LodgeComplaintDto = {
        wardId,
        category: 'ILLEGAL_DUMPING',
        title: 'Overflowing dump',
        description: 'Waste near street light',
        latitude: 27.7172,
        longitude: 85.324,
      };

      const result = await service.lodgeComplaint(tenantId, otherCitizenId, payload);
      expect(result.isDuplicate).toBe(true);
      if (result.isDuplicate) {
        expect(result.parentTicketNumber).toBe('WW-GRV-2611-1001');
        expect(result.parentId).toBe(complaintId);
      }
      expect(mockRepo.addSubscriber).toHaveBeenCalledWith(complaintId, otherCitizenId);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should not cluster MISSED_PICKUP complaints because they are household-specific', async () => {
      const payload: LodgeComplaintDto = {
        wardId,
        category: 'MISSED_PICKUP',
        title: 'Missed my morning bin',
        description: 'Truck passed without collecting',
        latitude: 27.7172,
        longitude: 85.324,
      };

      const result = await service.lodgeComplaint(tenantId, citizenId, payload);
      expect(result.isDuplicate).toBe(false);
      expect(mockRepo.findCandidateDuplicates).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Deterministic State Machine Transitions', () => {
    it('should allow Ward Officer to transition SUBMITTED to UNDER_REVIEW', async () => {
      const result = await service.triageComplaint(
        tenantId,
        complaintId,
        { status: 'UNDER_REVIEW' },
        wardOfficerUser
      );

      expect(result.status).toBe('UNDER_REVIEW');
      expect(mockRepo.updateTriage).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid transitions (e.g. SUBMITTED directly to RESOLVED)', async () => {
      await expect(
        service.triageComplaint(
          tenantId,
          complaintId,
          { status: 'RESOLVED' },
          wardOfficerUser
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should reject triage if citizen role attempts it', async () => {
      await expect(
        service.triageComplaint(
          tenantId,
          complaintId,
          { status: 'UNDER_REVIEW' },
          citizenUser
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should reject triage if Ward Officer is from a different ward', async () => {
      const otherWardOfficer: UserContext = {
        ...wardOfficerUser,
        wardId: otherWardId,
      };

      await expect(
        service.triageComplaint(
          tenantId,
          complaintId,
          { status: 'UNDER_REVIEW' },
          otherWardOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Resolution & Proof Workflow', () => {
    it('should allow field worker to resolve an ASSIGNED ticket', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce({
        ...baseComplaint,
        status: 'ASSIGNED',
        assignedToId: fieldWorkerUser.id,
      });

      const result = await service.resolveComplaint(
        tenantId,
        complaintId,
        {
          notes: 'Dumping cleared and area sanitized',
          proofPhoto: {
            fileUrl: 'https://storage.wastewise.np/proof.webp',
            fileKey: 'proof.webp',
            mimeType: 'image/webp',
            fileSize: 102400,
          },
        },
        fieldWorkerUser
      );

      expect(result.status).toBe('RESOLVED');
      expect(mockRepo.resolve).toHaveBeenCalledTimes(1);
    });

    it('should reject resolution if complaint is still in SUBMITTED status', async () => {
      await expect(
        service.resolveComplaint(
          tenantId,
          complaintId,
          { notes: 'premature resolve' },
          fieldWorkerUser
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Reopen & Citizen Feedback', () => {
    it('should allow reporting citizen to reopen ticket within 48h of resolution', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce({
        ...baseComplaint,
        status: 'RESOLVED',
        resolvedAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
      });

      const result = await service.reopenComplaint(
        tenantId,
        complaintId,
        { reason: 'Waste was only partially collected' },
        citizenUser
      );

      expect(result.status).toBe('REOPENED');
      expect(mockRepo.reopen).toHaveBeenCalledTimes(1);
    });

    it('should block reopening after the 48h resolution grace period', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce({
        ...baseComplaint,
        status: 'RESOLVED',
        resolvedAt: new Date(Date.now() - 50 * 3600 * 1000), // 50 hours ago
      });

      await expect(
        service.reopenComplaint(
          tenantId,
          complaintId,
          { reason: 'Late dispute' },
          citizenUser
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should allow citizen to submit feedback on resolved ticket', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce({
        ...baseComplaint,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      });

      await service.submitFeedback(
        tenantId,
        complaintId,
        { rating: 5, comments: 'Prompt and clean response!' },
        citizenUser
      );

      expect(mockRepo.addFeedback).toHaveBeenCalledWith(
        tenantId,
        complaintId,
        5,
        'Prompt and clean response!'
      );
    });

    it('should reject duplicate feedback submission', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce({
        ...baseComplaint,
        status: 'RESOLVED',
        resolvedAt: new Date(),
        feedback: { id: 'fb-1', rating: 5, comments: 'Good', createdAt: new Date() },
      });

      await expect(
        service.submitFeedback(
          tenantId,
          complaintId,
          { rating: 4 },
          citizenUser
        )
      ).rejects.toThrow(BadRequestError);
    });
  });
});

