import { ApiResponse, ApiErrorResponse, AuthTokens } from '../types/api.types';
import { useAuthStore } from '../stores/auth.store';

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
  private refreshPromise: Promise<string | null> | null = null;

  private getStorage(key: string): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  }

  private getAuthTokens(): AuthTokens | null {
    const tokens = this.getStorage('wastewise_tokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  private handleSessionExpired(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wastewise_tokens');
      localStorage.removeItem('wastewise_user');
      useAuthStore.getState().logout();
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register')) {
        window.location.href = '/login?expired=1';
      }
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    // If a refresh is already in flight, reuse the promise (prevents token rotation stampede)
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const tokens = this.getAuthTokens();
        if (!tokens?.refreshToken) {
          this.handleSessionExpired();
          return null;
        }

        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!refreshRes.ok) {
          this.handleSessionExpired();
          return null;
        }

        const refreshBody = (await refreshRes.json()) as ApiResponse<AuthTokens>;
        if (!refreshBody.data?.accessToken) {
          this.handleSessionExpired();
          return null;
        }

        const newTokens = refreshBody.data;
        localStorage.setItem('wastewise_tokens', JSON.stringify(newTokens));
        useAuthStore.getState().setTokens(newTokens);

        return newTokens.accessToken;
      } catch {
        this.handleSessionExpired();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const tokens = this.getAuthTokens();
    const tenantId = this.getStorage('wastewise_tenant_id');
    const tenantSubdomain = this.getStorage('wastewise_tenant_subdomain');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const isAuthRoute =
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/tenants/onboard');

    const isPublicRoute =
      isAuthRoute ||
      endpoint.startsWith('/auth/refresh') ||
      endpoint.startsWith('/health') ||
      endpoint.startsWith('/tenants/public') ||
      endpoint.startsWith('/payments/esewa/verify') ||
      endpoint.startsWith('/payments/khalti/verify');

    if (!isAuthRoute) {
      if (tenantId && !headers['X-Tenant-Subdomain']) {
        headers['X-Tenant-ID'] = tenantId;
      }
      if (tenantSubdomain && !headers['X-Tenant-Subdomain']) {
        headers['X-Tenant-Subdomain'] = tenantSubdomain;
      }
    }

    if (!isPublicRoute) {
      let activeToken = tokens?.accessToken;
      if (!activeToken && tokens?.refreshToken) {
        activeToken = (await this.refreshAccessToken()) ?? undefined;
      }

      if (!activeToken) {
        this.handleSessionExpired();
        throw new ApiClientError(
          'UNAUTHORIZED',
          'Authentication required: Please sign in to continue.',
          401
        );
      }

      headers['Authorization'] = `Bearer ${activeToken}`;
    } else if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const body = await response.json();

    if (!response.ok) {
      if (response.status === 404 && body && typeof body === 'object') {
        const errorResponse = body as ApiErrorResponse;
        if (errorResponse.error?.message?.toLowerCase().includes('tenant')) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('wastewise_tenant_id');
            localStorage.removeItem('wastewise_tenant_subdomain');
          }
        }
      }
      // Auto-refresh expired access tokens seamlessly (GEMINI.md Rule 5.2)
      if (
        response.status === 401 &&
        endpoint !== '/auth/refresh' &&
        endpoint !== '/auth/login'
      ) {
        const newAccessToken = await this.refreshAccessToken();
        if (newAccessToken) {
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (retryResponse.ok) {
            return (await retryResponse.json()) as ApiResponse<T>;
          }
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
    return this.request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }

  public async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
