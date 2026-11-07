import type { TenantContext, UserContext } from './user-context.types.js';

export type { TenantContext, UserContext };

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: UserContext;
    }
  }
}
