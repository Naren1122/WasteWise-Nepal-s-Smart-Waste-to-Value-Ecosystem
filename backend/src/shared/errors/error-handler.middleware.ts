import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ConflictError, NotFoundError } from './app-error.js';
import { ApiErrorResponse } from '../types/api-response.types.js';
import { env } from '../config/env.js';

export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const timestamp = new Date().toISOString();

  // Handle explicit domain AppErrors
  if (err instanceof AppError) {
    const errorBody: ApiErrorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        timestamp,
      },
    };
    res.status(err.statusCode).json(errorBody);
    return;
  }

  // Handle Prisma unique constraint violations (P2002) as 409 Conflict
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target)
      ? (err.meta.target as string[]).join(', ')
      : typeof err.meta?.target === 'string'
      ? err.meta.target
      : 'record';

    const conflictErr = new ConflictError(
      `A unique conflict occurred on ${target}. A record with this value already exists.`
    );

    const errorBody: ApiErrorResponse = {
      success: false,
      error: {
        code: conflictErr.errorCode,
        message: conflictErr.message,
        timestamp,
      },
    };
    res.status(conflictErr.statusCode).json(errorBody);
    return;
  }

  // Handle Prisma record not found (P2025) as 404 NotFound
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    const notFoundErr = new NotFoundError('Requested resource');
    const errorBody: ApiErrorResponse = {
      success: false,
      error: {
        code: notFoundErr.errorCode,
        message: 'The requested resource was not found or no longer exists.',
        timestamp,
      },
    };
    res.status(notFoundErr.statusCode).json(errorBody);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorBody: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input payload',
        details: err.flatten().fieldErrors,
        timestamp,
      },
    };
    res.status(422).json(errorBody);
    return;
  }

  // Handle unexpected or internal errors
  console.error('[Unhandled Error]:', err);

  const errorBody: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please try again later.' 
        : err instanceof Error ? err.message : 'Unknown internal error',
      timestamp,
    },
  };

  res.status(500).json(errorBody);
};

