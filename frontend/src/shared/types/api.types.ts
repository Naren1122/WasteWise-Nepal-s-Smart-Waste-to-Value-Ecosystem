export type UserRole =
  | 'SUPER_ADMIN'
  | 'MUNICIPAL_ADMIN'
  | 'WARD_OFFICER'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'FIELD_WORKER'
  | 'CITIZEN';

export interface UserProfile {
  id: string;
  tenantId: string;
  wardId: string | null;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    tenantId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

