import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service.js';
import { AuthRepository } from '../auth.repository.js';
import { Role, UserStatus } from '@prisma/client';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../../shared/errors/app-error.js';

vi.mock('../auth.repository.js');

describe('AuthService Security & Operations', () => {
  let authService: AuthService;
  let mockRepo: Record<string, ReturnType<typeof vi.fn>>;

  const mockTenant = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Kathmandu Metropolitan City',
    subdomain: 'kathmandu',
    province: 'Bagmati',
    district: 'Kathmandu',
    logoUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: '22222222-2222-2222-2222-222222222222',
    tenantId: mockTenant.id,
    wardId: null,
    fullName: 'Ram Bahadur',
    email: 'ram@kathmandu.gov.np',
    phone: '9841234567',
    passwordHash: '$2a$12$e8wZ3iQe.mockedHashValue',
    role: Role.CITIZEN,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      findTenantById: vi.fn(),
      findTenantBySubdomain: vi.fn(),
      findWardById: vi.fn(),
      findUserByEmailOrPhone: vi.fn(),
      findUserByIdentifier: vi.fn(),
      findUserById: vi.fn(),
      createUser: vi.fn(),
      createTenantWithAdmin: vi.fn(),
      createRefreshToken: vi.fn(),
      findRefreshTokenByHash: vi.fn(),
      revokeRefreshTokenFamily: vi.fn(),
      revokeRefreshTokenById: vi.fn(),
    };

    authService = new AuthService(mockRepo as unknown as AuthRepository);
  });

  it('should enforce CITIZEN role on public self-registration to prevent privilege escalation', async () => {
    mockRepo.findTenantById.mockResolvedValue(mockTenant);
    mockRepo.findUserByEmailOrPhone.mockResolvedValue(null);
    mockRepo.createUser.mockResolvedValue(mockUser);
    mockRepo.createRefreshToken.mockResolvedValue({});

    await authService.register(mockTenant.id, {
      fullName: 'Ram Bahadur',
      email: 'ram@kathmandu.gov.np',
      phone: '9841234567',
      password: 'Password123',
    });

    expect(mockRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: Role.CITIZEN,
      })
    );
  });

  it('should execute dummy hash comparison on non-existent user to equalize timing attacks', async () => {
    mockRepo.findTenantById.mockResolvedValue(mockTenant);
    mockRepo.findUserByIdentifier.mockResolvedValue(null);

    const bcryptSpy = vi.spyOn(bcrypt, 'compare');

    await expect(
      authService.login(mockTenant.id, {
        identifier: 'nonexistent@kathmandu.gov.np',
        password: 'Password123',
      })
    ).rejects.toThrow(UnauthorizedError);

    // Verify bcrypt was invoked to prevent user enumeration timing attacks
    expect(bcryptSpy).toHaveBeenCalledWith('Password123', expect.any(String));
  });

  it('should allow municipal admin to create staff with assigned roles (e.g. DRIVER)', async () => {
    mockRepo.findTenantById.mockResolvedValue(mockTenant);
    mockRepo.findUserByEmailOrPhone.mockResolvedValue(null);

    const driverUser = {
      ...mockUser,
      role: Role.DRIVER,
    };
    mockRepo.createUser.mockResolvedValue(driverUser);

    const result = await authService.createStaff(mockTenant.id, {
      fullName: 'Hari Bahadur Driver',
      email: 'hari.driver@kathmandu.gov.np',
      phone: '9849999999',
      password: 'SecurePassword123',
      role: Role.DRIVER,
    });

    expect(result.role).toBe(Role.DRIVER);
    expect(mockRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: Role.DRIVER,
      })
    );
  });

  it('should throw ConflictError if user already exists under the same tenant', async () => {
    mockRepo.findTenantById.mockResolvedValue(mockTenant);
    mockRepo.findUserByEmailOrPhone.mockResolvedValue(mockUser);

    await expect(
      authService.register(mockTenant.id, {
        fullName: 'Ram Bahadur',
        email: 'ram@kathmandu.gov.np',
        phone: '9841234567',
        password: 'Password123',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should invalidate family and throw alert if revoked refresh token is presented', async () => {
    const compromisedToken = {
      id: 'token-123',
      userId: mockUser.id,
      tokenHash: 'hash',
      familyId: 'family-456',
      isRevoked: true,
      expiresAt: new Date(Date.now() + 10000),
      createdAt: new Date(),
    };

    mockRepo.findRefreshTokenByHash.mockResolvedValue(compromisedToken);

    await expect(authService.refreshTokens('some-raw-token')).rejects.toThrow(UnauthorizedError);
    expect(mockRepo.revokeRefreshTokenFamily).toHaveBeenCalledWith('family-456');
  });

  it('should reject registration if wardId does not belong to the target municipality', async () => {
    mockRepo.findTenantById.mockResolvedValue(mockTenant);
    mockRepo.findWardById.mockResolvedValue(null);

    await expect(
      authService.register(mockTenant.id, {
        fullName: 'Ram Bahadur',
        email: 'ram@kathmandu.gov.np',
        phone: '9841234567',
        password: 'Password123',
        wardId: '99999999-9999-9999-9999-999999999999',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should block refreshTokens when the municipality tenant has been suspended', async () => {
    const validToken = {
      id: 'token-123',
      userId: mockUser.id,
      tokenHash: 'hash',
      familyId: 'family-456',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 10000),
      createdAt: new Date(),
    };

    mockRepo.findRefreshTokenByHash.mockResolvedValue(validToken);
    mockRepo.findUserById.mockResolvedValue(mockUser);
    mockRepo.findTenantById.mockResolvedValue({ ...mockTenant, isActive: false });

    await expect(authService.refreshTokens('some-raw-token')).rejects.toThrow(UnauthorizedError);
  });
});
