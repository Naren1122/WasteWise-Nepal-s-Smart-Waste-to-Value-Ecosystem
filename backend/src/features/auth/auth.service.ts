import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository.js';
import {
  RegisterDto,
  LoginDto,
  TenantOnboardDto,
  CreateStaffDto,
} from './auth.schema.js';
import {
  AuthResponseDto,
  AuthTokens,
  UserProfileDto,
  IAuthRepository,
} from './auth.types.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/app-error.js';
import { env } from '../../shared/config/env.js';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { DUMMY_HASH, hashToken, toUserProfileDto } from './auth.utils.js';

export class AuthService {
  constructor(private readonly repo: IAuthRepository = new AuthRepository()) {}

  public async register(tenantId: string, dto: RegisterDto): Promise<AuthResponseDto> {
    const tenant = await this.repo.findTenantById(tenantId);
    if (!tenant || !tenant.isActive) {
      throw new NotFoundError('Tenant', tenantId);
    }

    if (dto.wardId) {
      const ward = await this.repo.findWardById(tenantId, dto.wardId);
      if (!ward) {
        throw new NotFoundError('Ward in this municipality', dto.wardId);
      }
    }

    const existingUser = await this.repo.findUserByEmailOrPhone(tenantId, dto.email, dto.phone);
    if (existingUser) {
      throw new ConflictError('User with this email or phone number already exists in this municipality');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    // Security Fix: Public registration strictly assigns CITIZEN role (prevents privilege escalation)
    const user = await this.repo.createUser({
      tenantId,
      wardId: dto.wardId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: Role.CITIZEN,
    });

    const tokens = await this.generateTokens(user);
    return {
      user: toUserProfileDto(user),
      tokens,
      tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
    };
  }

  public async createStaff(tenantId: string, dto: CreateStaffDto): Promise<UserProfileDto> {
    const tenant = await this.repo.findTenantById(tenantId);
    if (!tenant || !tenant.isActive) {
      throw new NotFoundError('Tenant', tenantId);
    }

    if (dto.wardId) {
      const ward = await this.repo.findWardById(tenantId, dto.wardId);
      if (!ward) {
        throw new NotFoundError('Ward in this municipality', dto.wardId);
      }
    }

    const existingUser = await this.repo.findUserByEmailOrPhone(tenantId, dto.email, dto.phone);
    if (existingUser) {
      throw new ConflictError('Staff member with this email or phone number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const staff = await this.repo.createUser({
      tenantId,
      wardId: dto.wardId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
    });

    return toUserProfileDto(staff);
  }

  public async login(tenantId: string, dto: LoginDto): Promise<AuthResponseDto> {
    const tenant = await this.repo.findTenantById(tenantId);
    if (!tenant || !tenant.isActive) {
      throw new NotFoundError('Tenant', tenantId);
    }

    const user = await this.repo.findUserByIdentifier(tenantId, dto.identifier);

    // Security Fix: Prevent timing attacks / user enumeration by running comparison on dummy hash
    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedError('Invalid email/phone or password');
    }

    // Security Fix: Verify password FIRST before checking account status
    // to prevent user enumeration and timing leaks regarding inactive/suspended accounts
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email/phone or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is inactive or suspended');
    }

    const tokens = await this.generateTokens(user);
    return {
      user: toUserProfileDto(user),
      tokens,
      tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
    };
  }

  public async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await this.repo.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      // Possible token theft / replay attack: invalidate all tokens in this family
      await this.repo.revokeRefreshTokenFamily(storedToken.familyId);
      throw new UnauthorizedError('Security alert: Refresh token already used. All active sessions revoked.');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = await this.repo.findUserById(storedToken.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account invalid or inactive');
    }

    // Security Fix: Ensure tenant is still active to prevent deactivated municipalities from refreshing tokens
    const tenant = await this.repo.findTenantById(user.tenantId);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedError('Municipality subscription is inactive or suspended');
    }

    // Prepare new rotated refresh token
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Atomic rotation: Revoke old token and create new token inside a single transaction
    const rotated = await this.repo.rotateRefreshTokenAtomic(
      storedToken.id,
      storedToken.familyId,
      {
        userId: user.id,
        tokenHash: newTokenHash,
        familyId: storedToken.familyId,
        expiresAt,
      }
    );

    // If race condition occurred and another request already rotated it, trigger reuse detection
    if (!rotated) {
      await this.repo.revokeRefreshTokenFamily(storedToken.familyId);
      throw new UnauthorizedError('Security alert: Refresh token already used or concurrent rotation detected.');
    }

    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: '15m',
    };
  }

  public async onboardTenant(dto: TenantOnboardDto): Promise<AuthResponseDto> {
    const existingTenant = await this.repo.findTenantBySubdomain(dto.subdomain);
    if (existingTenant) {
      throw new ConflictError(`Municipality with subdomain '${dto.subdomain}' already exists`);
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
    const { tenant, admin } = await this.repo.createTenantWithAdmin({
      name: dto.municipalityName,
      subdomain: dto.subdomain,
      province: dto.province,
      district: dto.district,
      adminFullName: dto.adminFullName,
      adminEmail: dto.adminEmail,
      adminPhone: dto.adminPhone,
      adminPasswordHash: passwordHash,
    });

    const tokens = await this.generateTokens(admin);
    return {
      user: toUserProfileDto(admin),
      tokens,
      tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
    };
  }

  private async generateTokens(user: User, existingFamilyId?: string): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const familyId = existingFamilyId ?? uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: '15m',
    };
  }
}
