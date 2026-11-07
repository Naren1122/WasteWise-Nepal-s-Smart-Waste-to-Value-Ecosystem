import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma.service.js';
import { redis, isRedisReady } from '../database/redis.service.js';
import { BadRequestError, NotFoundError } from '../errors/app-error.js';

const uuidSchema = z.string().uuid();
const subdomainRegex = /^[a-z0-9-]{1,50}$/;

const TENANT_SELECT = { id: true, name: true, subdomain: true, isActive: true } as const;

const CachedTenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  subdomain: z.string(),
  isActive: z.boolean(),
});

/**
 * Resolves active tenant with a short-TTL (60s) Redis cache to avoid hitting
 * PostgreSQL on every HTTP request across the application (Item 22).
 * Validates cached JSON through Zod schema to enforce strict typing (Item 6).
 */
const findActiveTenant = async (where: { id: string } | { subdomain: string }) => {
  const isById = 'id' in where;
  const cacheKey = isById ? `cache:tenant:id:${where.id}` : `cache:tenant:subdomain:${where.subdomain}`;

  if (isRedisReady()) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        const validated = CachedTenantSchema.safeParse(parsed);
        if (validated.success && validated.data.isActive) {
          return validated.data;
        }
        console.debug('[Redis] Invalid cached tenant schema, falling back to DB:', cacheKey);
      }
    } catch (err) {
      console.debug('[Redis] Failed to read cached tenant:', err);
    }
  }

  const tenant = await prisma.tenant.findUnique({ where, select: TENANT_SELECT });
  if (tenant && tenant.isActive) {
    if (isRedisReady()) {
      redis
        .set(cacheKey, JSON.stringify(tenant), 'EX', 60)
        .catch((err) => console.debug('[Redis] Failed to cache tenant:', err));
    }
    return tenant;
  }
  return null;
};

const extractHeader = (val: string | string[] | undefined): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const tenantContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawTenantId = extractHeader(req.headers['x-tenant-id']);
    const rawSubdomain = extractHeader(req.headers['x-tenant-subdomain']);

    // 1. Validate X-Tenant-ID format if present
    if (rawTenantId !== undefined) {
      if (!uuidSchema.safeParse(rawTenantId).success) {
        next(new BadRequestError('Invalid X-Tenant-ID header: must be a valid UUID'));
        return;
      }
    }

    // 2. Validate & normalize X-Tenant-Subdomain format if present
    let normalizedSubdomain: string | undefined;
    if (rawSubdomain !== undefined) {
      normalizedSubdomain = rawSubdomain.toLowerCase();
      if (!subdomainRegex.test(normalizedSubdomain)) {
        next(new BadRequestError('Invalid X-Tenant-Subdomain header format'));
        return;
      }
    }

    // 3. Both headers supplied: verify they resolve to the exact same tenant
    if (rawTenantId && normalizedSubdomain) {
      const [tenantById, tenantBySubdomain] = await Promise.all([
        findActiveTenant({ id: rawTenantId }),
        findActiveTenant({ subdomain: normalizedSubdomain }),
      ]);

      if (!tenantById) {
        next(new NotFoundError('Tenant', rawTenantId));
        return;
      }

      if (!tenantBySubdomain) {
        next(new NotFoundError('Tenant'));
        return;
      }

      if (tenantById.id !== tenantBySubdomain.id) {
        next(new BadRequestError('Tenant headers do not match'));
        return;
      }

      req.tenant = { id: tenantById.id, name: tenantById.name, subdomain: tenantById.subdomain };
      next();
      return;
    }

    // 4. Resolve via explicit tenant ID
    if (rawTenantId) {
      const tenant = await findActiveTenant({ id: rawTenantId });
      if (!tenant) {
        next(new NotFoundError('Tenant', rawTenantId));
        return;
      }

      req.tenant = { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain };
      next();
      return;
    }

    // 5. Resolve via municipality subdomain
    if (normalizedSubdomain) {
      const tenant = await findActiveTenant({ subdomain: normalizedSubdomain });
      if (!tenant) {
        next(new NotFoundError('Tenant'));
        return;
      }

      req.tenant = { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain };
      next();
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
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
