export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly statusCode: number = 500,
    public readonly errorCode: string = 'INTERNAL_SERVER_ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' not found` : `${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(messageOrDetails?: string | unknown, details?: unknown) {
    if (typeof messageOrDetails === 'string') {
      super(messageOrDetails, 422, 'VALIDATION_ERROR', details);
    } else {
      super('Invalid request data', 422, 'VALIDATION_ERROR', messageOrDetails);
    }
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

