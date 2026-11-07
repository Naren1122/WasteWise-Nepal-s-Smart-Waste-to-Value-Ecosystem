import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../database/prisma.service.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { Role } from '@prisma/client';
import type { UserContext } from '../types/user-context.types.js';

const AccessTokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  role: z.nativeEnum(Role).optional(),
  exp: z.number(),
});

export interface AuthenticatedUserWithTokenMeta extends UserContext {
  exp: number;
}

/**
 * Shared access-token authenticator used by both Express REST middleware (authGuard)
 * and WebSocket connection middleware (TrackingGateway).
 *
 * Verifies JWT with strict HS256 algorithm enforcement, validates payload schema,
 * and fetches the latest user status directly from the database to ensure
 * suspended or deactivated accounts are blocked immediately across both protocols.
 */
export async function authenticateAccessToken(
  token: string
): Promise<AuthenticatedUserWithTokenMeta> {
  let decodedRaw: unknown;
  try {
    decodedRaw = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }

  const parsed = AccessTokenPayloadSchema.safeParse(decodedRaw);
  if (!parsed.success) {
    throw new UnauthorizedError('Malformed access token payload');
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      tenantId: true,
      email: true,
      role: true,
      status: true,
      wardId: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('User account is invalid or deactivated');
  }

  return {
    id: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    wardId: user.wardId,
    exp: parsed.data.exp,
  };
}

