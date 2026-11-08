import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../audit.service.js';
import { auditRepository } from '../audit.repository.js';
import { sanitizeAuditPayload, computeAuditDiff } from '../../../shared/utils/audit-logger.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import { Role, AuditAction } from '@prisma/client';

vi.mock('../audit.repository.js', () => ({
  auditRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
  },
}));

describe('AuditService & Audit Utilities', () => {
  let service: AuditService;
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const logId = '99999999-9999-9999-9999-999999999999';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuditService();
  });

  describe('listAuditLogs', () => {
    it('queries repository with tenant scoping and pagination parameters', async () => {
      const mockResult = {
        data: [
          {
            id: logId,
            tenantId,
            actorUserId: 'u-1',
            actorUserName: 'Admin User',
            actorRole: Role.MUNICIPAL_ADMIN,
            ipAddress: '127.0.0.1',
            entityType: 'Complaint',
            entityId: 'c-101',
            action: AuditAction.STATUS_CHANGE,
            description: 'Triage ticket',
            createdAt: new Date('2026-11-06T12:00:00.000Z'),
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      vi.mocked(auditRepository.findMany).mockResolvedValueOnce(mockResult);

      const res = await service.listAuditLogs(tenantId, { page: 1, pageSize: 20 });

      expect(res.data).toHaveLength(1);
      expect(res.data[0]!.entityType).toBe('Complaint');
      expect(auditRepository.findMany).toHaveBeenCalledWith(tenantId, { page: 1, pageSize: 20 });
    });
  });

  describe('getAuditLogById', () => {
    it('returns detailed audit record with delta diffs', async () => {
      const mockDetail = {
        id: logId,
        tenantId,
        actorUserId: 'u-1',
        actorUserName: 'Admin User',
        actorRole: Role.MUNICIPAL_ADMIN,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        entityType: 'Complaint',
        entityId: 'c-101',
        action: AuditAction.STATUS_CHANGE,
        diffBefore: { status: 'SUBMITTED' },
        diffAfter: { status: 'ASSIGNED' },
        description: 'Triage ticket',
        createdAt: new Date('2026-11-06T12:00:00.000Z'),
      };

      vi.mocked(auditRepository.findById).mockResolvedValueOnce(mockDetail);

      const res = await service.getAuditLogById(tenantId, logId);

      expect(res.id).toBe(logId);
      expect(res.diffBefore).toEqual({ status: 'SUBMITTED' });
      expect(res.diffAfter).toEqual({ status: 'ASSIGNED' });
    });

    it('throws NotFoundError when record is missing or belongs to another tenant', async () => {
      vi.mocked(auditRepository.findById).mockResolvedValueOnce(null);

      await expect(service.getAuditLogById(tenantId, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('sanitizeAuditPayload', () => {
    it('strips credentials and password hashes from diff payloads', () => {
      const sensitive = {
        fullName: 'Ram Bahadur',
        email: 'ram@example.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
        tokenHash: 'sha256-hash',
        secret: 'api-secret-key',
      };

      const sanitized = sanitizeAuditPayload(sensitive) as Record<string, unknown>;

      expect(sanitized['fullName']).toBe('Ram Bahadur');
      expect(sanitized['email']).toBe('ram@example.com');
      expect(sanitized['passwordHash']).toBe('[REDACTED]');
      expect(sanitized['tokenHash']).toBe('[REDACTED]');
      expect(sanitized['secret']).toBe('[REDACTED]');
    });
  });

  describe('computeAuditDiff', () => {
    it('extracts only changed properties between states', () => {
      const before = { status: 'SUBMITTED', priority: 'MEDIUM', notes: 'Initial' };
      const after = { status: 'ASSIGNED', priority: 'HIGH', notes: 'Initial' };

      const diff = computeAuditDiff(before, after);

      expect(diff.diffBefore).toEqual({ status: 'SUBMITTED', priority: 'MEDIUM' });
      expect(diff.diffAfter).toEqual({ status: 'ASSIGNED', priority: 'HIGH' });
    });
  });
});

