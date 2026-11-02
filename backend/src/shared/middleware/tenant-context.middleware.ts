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

  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, subdomain: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      next(new NotFoundError('Tenant', tenantId));
      return;
    }

    req.tenant = { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain };
    next();
    return;
  }

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

