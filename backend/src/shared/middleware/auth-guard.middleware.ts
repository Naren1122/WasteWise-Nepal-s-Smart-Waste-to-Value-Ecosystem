import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../database/prisma.service.js';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import { Role } from '@prisma/client';

interface JwtAccessPayload {
  userId: string;
  tenantId: string;
  role: Role;
}

export const authGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    next(new UnauthorizedError('Access token is required'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      next(new UnauthorizedError('User account is invalid or deactivated'));
      return;
    }

    // Hard Multi-Tenant Isolation Check
    if (req.tenant && req.tenant.id !== user.tenantId) {
      next(new ForbiddenError('Access denied: User does not belong to the requested tenant'));
      return;
    }

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      wardId: user.wardId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token has expired'));
      return;
    }
    next(new UnauthorizedError('Invalid access token'));
  }
};

