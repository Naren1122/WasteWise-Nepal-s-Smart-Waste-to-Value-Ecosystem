import { Response } from 'express';
import { ApiResponse } from '../types/api-response.types.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  options: {
    status?: number;
    message?: string;
    tenantId?: string;
  } = {}
): void {
  const status = options.status ?? 200;
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(options.message ? { message: options.message } : {}),
    meta: {
      timestamp: new Date().toISOString(),
      ...(options.tenantId ? { tenantId: options.tenantId } : {}),
    },
  };
  res.status(status).json(response);
}

