import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.service.js';
import { BadRequestError, NotFoundError } from '../errors/app-error.js';

export const tenantContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const tenantId = req.headers['x-tenant-id'] as string | undefined;
  const subdomain = req.headers['x-tenant-subdomain'] as string | undefined;

  // 1. If explicit tenant ID is provided, verify against active database records
  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, subdomain: true, isActive: true },
    });

    if (tenant && tenant.isActive) {
      req.tenant = { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain };
      next();
      return;
    }

    // If tenantId was stale / not found, but a valid subdomain was also provided,
    // gracefully fall back to subdomain resolution instead of crashing
    if (!subdomain) {
      next(new NotFoundError('Tenant', tenantId));
      return;
    }
  }

  // 2. Resolve via municipality subdomain
  if (subdomain) {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true, name: true, subdomain: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      next(new NotFoundError(`Tenant with subdomain '${subdomain}'`));
      return;
    }

    req.tenant = { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain };
    next();
    return;
  }

  next();
};

export const requireTenant = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.tenant) {
    next(new BadRequestError('Tenant context required: pass X-Tenant-ID or X-Tenant-Subdomain header'));
    return;
  }
  next();
};
