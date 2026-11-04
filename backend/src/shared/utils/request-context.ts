import { Request } from 'express';
import { Role } from '@prisma/client';
import { UnauthorizedError, BadRequestError } from '../errors/app-error.js';

export interface RequestContext {
  tenantId: string;
  userId: string;
  role: Role;
  wardId?: string | null;
}

export function getRequestContext(req: Request): RequestContext {
  if (!req.tenant?.id) {
    throw new BadRequestError('Tenant context required');
  }
  if (!req.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }
  return {
    tenantId: req.tenant.id,
    userId: req.user.id,
    role: req.user.role,
    wardId: req.user.wardId ?? null,
  };
}

