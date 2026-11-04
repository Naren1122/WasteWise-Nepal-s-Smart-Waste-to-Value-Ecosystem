import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types/api-response.types.js';

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

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  },
  options: {
    status?: number;
    message?: string;
    tenantId?: string;
  } = {}
): void {
  const status = options.status ?? 200;
  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize) || 1;
  const paginationMeta: PaginationMeta = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: pagination.totalCount,
    totalPages,
    hasNextPage: pagination.page * pagination.pageSize < pagination.totalCount,
    hasPreviousPage: pagination.page > 1,
  };

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: paginationMeta,
    meta: {
      timestamp: new Date().toISOString(),
      ...(options.tenantId ? { tenantId: options.tenantId } : {}),
    },
  };
  res.status(status).json(response);
}
