import { ApiResponse, ApiErrorResponse, AuthTokens } from '../types/api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private getAuthTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null;
    const tokens = localStorage.getItem('wastewise_tokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  private getTenantId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('wastewise_tenant_id');
  }

  private getTenantSubdomain(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('wastewise_tenant_subdomain');
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const tokens = this.getAuthTokens();
    const tenantId = this.getTenantId();
    const tenantSubdomain = this.getTenantSubdomain();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    if (tenantSubdomain) {
      headers['X-Tenant-Subdomain'] = tenantSubdomain;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const body = await response.json();

    if (!response.ok) {
      // Auto-refresh expired access tokens seamlessly (GEMINI.md Rule 5.2)
      if (
        response.status === 401 &&
        tokens?.refreshToken &&
        endpoint !== '/auth/refresh' &&
        endpoint !== '/auth/login'
      ) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshBody = (await refreshRes.json()) as ApiResponse<AuthTokens>;
            if (refreshBody.data) {
              localStorage.setItem('wastewise_tokens', JSON.stringify(refreshBody.data));
              headers['Authorization'] = `Bearer ${refreshBody.data.accessToken}`;
              const retryResponse = await fetch(url, { ...options, headers });
              if (retryResponse.ok) {
                return (await retryResponse.json()) as ApiResponse<T>;
              }
            }
          }
        } catch {
          // Refresh failed, continue to throw ApiClientError
        }
      }

      const errorResponse = body as ApiErrorResponse;
      throw new ApiClientError(
        errorResponse.error?.code || 'UNKNOWN_ERROR',
        errorResponse.error?.message || 'An error occurred during API request',
        response.status,
        errorResponse.error?.details
      );
    }

    return body as ApiResponse<T>;
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

