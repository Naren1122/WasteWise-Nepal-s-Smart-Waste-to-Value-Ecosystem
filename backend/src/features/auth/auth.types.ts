import { Role, UserStatus, User, Tenant, RefreshToken, Ward, Prisma, PrismaClient } from '@prisma/client';

export type DbClient = PrismaClient | Prisma.TransactionClient;

export interface UserProfileDto {
  id: string;
  tenantId: string;
  wardId: string | null;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponseDto {
  user: UserProfileDto;
  tokens: AuthTokens;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export interface CreateUserData {
  tenantId: string;
  wardId?: string | undefined;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
}

export interface CreateTenantWithAdminData {
  name: string;
  subdomain: string;
  province: string;
  district: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  adminPasswordHash: string;
}

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

export interface IAuthRepository {
  findTenantById(tenantId: string, db?: DbClient): Promise<Tenant | null>;
  findTenantBySubdomain(subdomain: string, db?: DbClient): Promise<Tenant | null>;
  findWardById(tenantId: string, wardId: string, db?: DbClient): Promise<Ward | null>;
  findUserByEmailOrPhone(tenantId: string, email: string, phone: string, db?: DbClient): Promise<User | null>;
  findUserByIdentifier(tenantId: string, identifier: string, db?: DbClient): Promise<User | null>;
  findUserById(id: string, tenantId?: string, db?: DbClient): Promise<User | null>;
  createUser(data: CreateUserData, db?: DbClient): Promise<User>;
  createTenantWithAdmin(data: CreateTenantWithAdminData): Promise<{ tenant: Tenant; admin: User }>;
  createRefreshToken(data: CreateRefreshTokenData, db?: DbClient): Promise<RefreshToken>;
  findRefreshTokenByHash(tokenHash: string, db?: DbClient): Promise<RefreshToken | null>;
  revokeRefreshTokenFamily(familyId: string, db?: DbClient): Promise<void>;
  revokeRefreshTokenById(id: string, db?: DbClient): Promise<void>;
  rotateRefreshTokenAtomic(
    oldTokenId: string,
    familyId: string,
    newTokenData: CreateRefreshTokenData
  ): Promise<boolean>;
}


