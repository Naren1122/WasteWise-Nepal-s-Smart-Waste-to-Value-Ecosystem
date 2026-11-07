import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import { authenticateAccessToken } from '../auth/authenticate-access-token.js';

export const authGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next(new UnauthorizedError('Missing Authorization header'));
    return;
  }

  const match = authHeader.match(/^bearer\s+(\S+)$/i);
  if (!match || !match[1]) {
    next(new UnauthorizedError('Malformed Authorization header: format must be Bearer <token>'));
    return;
  }

  const token = match[1];

  try {
    const user = await authenticateAccessToken(token);

    // Hard Multi-Tenant Isolation Check
    if (req.tenant && req.tenant.id !== user.tenantId) {
      next(new ForbiddenError('Access denied: User does not belong to the requested tenant'));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    // Only JWT and account status issues throw UnauthorizedError (401).
    // Database and unexpected infrastructure failures safely bubble to next(err) as 500s.
    next(error);
  }
};
