import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authGuard } from '../auth-guard.middleware.js';
import { prisma } from '../../database/prisma.service.js';
import { env } from '../../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../../errors/app-error.js';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../database/prisma.service.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('authGuard & authenticateAccessToken', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const validUserId = '11111111-1111-1111-1111-111111111111';
  const validTenantId = '22222222-2222-2222-2222-222222222222';
  const otherTenantId = '33333333-3333-3333-3333-333333333333';

  const generateToken = (payload: object, options?: jwt.SignOptions) => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
    };
    res = {};
    next = vi.fn();
  });

  it('should return 401 Unauthorized if Authorization header is missing', async () => {
    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('Missing Authorization header');
  });

  it('should return 401 Unauthorized if Authorization header is malformed or contains extra segments', async () => {
    req.headers = { authorization: 'Bearer token extra-segment' };

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('Malformed Authorization header: format must be Bearer <token>');
  });

  it('should accept case-insensitive "bearer" scheme', async () => {
    const token = generateToken({ userId: validUserId, tenantId: validTenantId, role: Role.DRIVER });
    req.headers = { authorization: `bearer ${token}` };

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: validUserId,
      tenantId: validTenantId,
      email: 'driver@ktm.gov.np',
      role: Role.DRIVER,
      status: 'ACTIVE',
      wardId: null,
    } as any);

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user?.id).toBe(validUserId);
  });

  it('should return 401 Unauthorized if token is expired', async () => {
    const expiredToken = generateToken(
      { userId: validUserId, tenantId: validTenantId, role: Role.DRIVER },
      { expiresIn: '-1s' }
    );
    req.headers = { authorization: `Bearer ${expiredToken}` };

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('Access token has expired');
  });

  it('should return 401 Unauthorized if token signature is invalid', async () => {
    const badToken = jwt.sign(
      { userId: validUserId, tenantId: validTenantId },
      'wrong-secret',
      { algorithm: 'HS256' }
    );
    req.headers = { authorization: `Bearer ${badToken}` };

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('Invalid access token');
  });

  it('should return 401 Unauthorized if token payload has invalid userId schema', async () => {
    const badPayloadToken = generateToken({ userId: 'not-a-uuid' });
    req.headers = { authorization: `Bearer ${badPayloadToken}` };

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('Malformed access token payload');
  });

  it('should return 401 Unauthorized if user is not found in database', async () => {
    const token = generateToken({ userId: validUserId, tenantId: validTenantId, role: Role.DRIVER });
    req.headers = { authorization: `Bearer ${token}` };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('User account is invalid or deactivated');
  });

  it('should return 401 Unauthorized if user is deactivated or suspended', async () => {
    const token = generateToken({ userId: validUserId, tenantId: validTenantId, role: Role.DRIVER });
    req.headers = { authorization: `Bearer ${token}` };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: validUserId,
      tenantId: validTenantId,
      email: 'driver@ktm.gov.np',
      role: Role.DRIVER,
      status: 'SUSPENDED',
      wardId: null,
    } as any);

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('User account is invalid or deactivated');
  });

  it('should return 403 Forbidden if user tenant does not match requested tenant context', async () => {
    const token = generateToken({ userId: validUserId, tenantId: validTenantId, role: Role.DRIVER });
    req.headers = { authorization: `Bearer ${token}` };
    req.tenant = { id: otherTenantId, name: 'Lalitpur', subdomain: 'lalitpur' };

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: validUserId,
      tenantId: validTenantId,
      email: 'driver@ktm.gov.np',
      role: Role.DRIVER,
      status: 'ACTIVE',
      wardId: null,
    } as any);

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe('Access denied: User does not belong to the requested tenant');
  });

  it('should forward database errors as 500s rather than misrepresenting them as 401s', async () => {
    const token = generateToken({ userId: validUserId, tenantId: validTenantId, role: Role.DRIVER });
    req.headers = { authorization: `Bearer ${token}` };

    const dbCrashError = new Error('Connection lost to PostgreSQL');
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(dbCrashError);

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(dbCrashError);
  });

  it('should set req.user and call next() on valid active token and tenant', async () => {
    const token = generateToken({ userId: validUserId, tenantId: validTenantId, role: Role.DRIVER });
    req.headers = { authorization: `Bearer ${token}` };
    req.tenant = { id: validTenantId, name: 'KTM', subdomain: 'ktm' };

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: validUserId,
      tenantId: validTenantId,
      email: 'driver@ktm.gov.np',
      role: Role.DRIVER,
      status: 'ACTIVE',
      wardId: '44444444-4444-4444-4444-444444444444',
    } as any);

    await authGuard(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({
      id: validUserId,
      tenantId: validTenantId,
      role: Role.DRIVER,
      email: 'driver@ktm.gov.np',
      wardId: '44444444-4444-4444-4444-444444444444',
    });
  });
});
