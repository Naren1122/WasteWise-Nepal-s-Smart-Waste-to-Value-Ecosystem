import { prisma } from '../../shared/database/prisma.service.js';
import { Role } from '@prisma/client';
import type { User, Tenant, RefreshToken, Ward } from '@prisma/client';
import type {
  CreateUserData,
  CreateTenantWithAdminData,
  CreateRefreshTokenData,
  IAuthRepository,
  DbClient,
} from './auth.types.js';

export class AuthRepository implements IAuthRepository {
  public async findTenantById(tenantId: string, db: DbClient = prisma): Promise<Tenant | null> {
    return db.tenant.findUnique({
      where: { id: tenantId },
    });
  }

  public async findTenantBySubdomain(subdomain: string, db: DbClient = prisma): Promise<Tenant | null> {
    return db.tenant.findUnique({
      where: { subdomain },
    });
  }

  public async findWardById(
    tenantId: string,
    wardId: string,
    db: DbClient = prisma
  ): Promise<Ward | null> {
    return db.ward.findFirst({
      where: { id: wardId, tenantId },
    });
  }

  public async findUserByEmailOrPhone(
    tenantId: string,
    email: string,
    phone: string,
    db: DbClient = prisma
  ): Promise<User | null> {
    return db.user.findFirst({
      where: {
        tenantId,
        OR: [{ email }, { phone }],
      },
    });
  }

  public async findUserByIdentifier(
    tenantId: string,
    identifier: string,
    db: DbClient = prisma
  ): Promise<User | null> {
    return db.user.findFirst({
      where: {
        tenantId,
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
  }

  public async findUserById(
    id: string,
    tenantId?: string,
    db: DbClient = prisma
  ): Promise<User | null> {
    return db.user.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  public async createUser(data: CreateUserData, db: DbClient = prisma): Promise<User> {
    return db.user.create({
      data: {
        tenantId: data.tenantId,
        wardId: data.wardId ?? null,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
  }

  public async createTenantWithAdmin(data: CreateTenantWithAdminData): Promise<{ tenant: Tenant; admin: User }> {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          province: data.province,
          district: data.district,
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          fullName: data.adminFullName,
          email: data.adminEmail,
          phone: data.adminPhone,
          passwordHash: data.adminPasswordHash,
          role: Role.MUNICIPAL_ADMIN,
        },
      });

      return { tenant, admin };
    });
  }

  public async createRefreshToken(
    data: CreateRefreshTokenData,
    db: DbClient = prisma
  ): Promise<RefreshToken> {
    return db.refreshToken.create({
      data,
    });
  }

  public async findRefreshTokenByHash(tokenHash: string, db: DbClient = prisma): Promise<RefreshToken | null> {
    return db.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  public async revokeRefreshTokenFamily(familyId: string, db: DbClient = prisma): Promise<void> {
    await db.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }

  public async revokeRefreshTokenById(id: string, db: DbClient = prisma): Promise<void> {
    await db.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  public async rotateRefreshTokenAtomic(
    oldTokenId: string,
    familyId: string,
    newTokenData: CreateRefreshTokenData
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      // Atomic compare-and-swap: only revoke if it's currently active (not revoked)
      const { count } = await tx.refreshToken.updateMany({
        where: { id: oldTokenId, isRevoked: false },
        data: { isRevoked: true },
      });

      // If count is not 1, another concurrent request already revoked or rotated it
      if (count !== 1) {
        return false;
      }

      await tx.refreshToken.create({
        data: newTokenData,
      });

      return true;
    });
  }
}
