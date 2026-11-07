import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantContextMiddleware, requireTenant } from '../tenant-context.middleware.js';
import { prisma } from '../../database/prisma.service.js';
import { BadRequestError, NotFoundError } from '../../errors/app-error.js';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../database/prisma.service.js', () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

describe('tenantContextMiddleware & requireTenant', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const validTenantId = '11111111-1111-1111-1111-111111111111';
  const otherTenantId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
    };
    res = {};
    next = vi.fn();
  });

  it('should return BadRequestError when X-Tenant-ID is not a valid UUID without echoing raw input', async () => {
    req.headers = { 'x-tenant-id': 'abc' };

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.message).toBe('Invalid X-Tenant-ID header: must be a valid UUID');
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('should return BadRequestError when X-Tenant-Subdomain contains invalid characters', async () => {
    req.headers = { 'x-tenant-subdomain': 'invalid_subdomain!' };

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.message).toBe('Invalid X-Tenant-Subdomain header format');
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('should resolve tenant when valid X-Tenant-ID is provided', async () => {
    req.headers = { 'x-tenant-id': validTenantId };
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
      id: validTenantId,
      name: 'Kathmandu Metro',
      subdomain: 'ktm',
      isActive: true,
    } as any);

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.tenant).toEqual({
      id: validTenantId,
      name: 'Kathmandu Metro',
      subdomain: 'ktm',
    });
  });

  it('should return NotFoundError when tenant ID does not exist in DB', async () => {
    req.headers = { 'x-tenant-id': validTenantId };
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null);

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('should return NotFoundError when tenant is marked inactive', async () => {
    req.headers = { 'x-tenant-id': validTenantId };
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
      id: validTenantId,
      name: 'Inactive Metro',
      subdomain: 'inactive',
      isActive: false,
    } as any);

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('should normalize subdomain to lowercase and resolve tenant', async () => {
    req.headers = { 'x-tenant-subdomain': 'LALITPUR' };
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
      id: otherTenantId,
      name: 'Lalitpur Metro',
      subdomain: 'lalitpur',
      isActive: true,
    } as any);

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { subdomain: 'lalitpur' },
      select: { id: true, name: true, subdomain: true, isActive: true },
    });
    expect(req.tenant).toEqual({
      id: otherTenantId,
      name: 'Lalitpur Metro',
      subdomain: 'lalitpur',
    });
  });

  it('should return BadRequestError with safe generic message when both X-Tenant-ID and X-Tenant-Subdomain mismatch', async () => {
    req.headers = {
      'x-tenant-id': validTenantId,
      'x-tenant-subdomain': 'lalitpur',
    };

    vi.mocked(prisma.tenant.findUnique)
      .mockResolvedValueOnce({
        id: validTenantId,
        name: 'Kathmandu Metro',
        subdomain: 'ktm',
        isActive: true,
      } as any)
      .mockResolvedValueOnce({
        id: otherTenantId,
        name: 'Lalitpur Metro',
        subdomain: 'lalitpur',
        isActive: true,
      } as any);

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.message).toBe('Tenant headers do not match');
  });

  it('should forward database exceptions to next(err) safely without crashing', async () => {
    req.headers = { 'x-tenant-id': validTenantId };
    const dbError = new Error('Database connection pool exhausted');
    vi.mocked(prisma.tenant.findUnique).mockRejectedValueOnce(dbError);

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });

  it('should proceed without setting req.tenant when no tenant headers are supplied', async () => {
    req.headers = {};

    await tenantContextMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.tenant).toBeUndefined();
  });

  it('requireTenant should reject with BadRequestError if req.tenant is not set', () => {
    req.tenant = undefined;

    requireTenant(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
  });

  it('requireTenant should call next() if req.tenant is set', () => {
    req.tenant = { id: validTenantId, name: 'KTM', subdomain: 'ktm' };

    requireTenant(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
