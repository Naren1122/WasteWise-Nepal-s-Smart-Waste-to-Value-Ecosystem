import { create } from 'zustand';
import { AuthSession, UserProfile, AuthTokens } from '../types/api.types';

export interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  tenantId: string | null;
  tenantSubdomain: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  setTenant: (id: string, subdomain: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  tenantId: null,
  tenantSubdomain: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (session: AuthSession) => {
    localStorage.setItem('wastewise_tokens', JSON.stringify(session.tokens));
    localStorage.setItem('wastewise_user', JSON.stringify(session.user));
    localStorage.setItem('wastewise_tenant_id', session.tenant.id);
    localStorage.setItem('wastewise_tenant_subdomain', session.tenant.subdomain);

    set({
      user: session.user,
      tokens: session.tokens,
      tenantId: session.tenant.id,
      tenantSubdomain: session.tenant.subdomain,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setTenant: (id: string, subdomain: string) => {
    localStorage.setItem('wastewise_tenant_id', id);
    localStorage.setItem('wastewise_tenant_subdomain', subdomain);
    set({ tenantId: id, tenantSubdomain: subdomain });
  },

  logout: () => {
    localStorage.removeItem('wastewise_tokens');
    localStorage.removeItem('wastewise_user');
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;

    try {
      const storedTokens = localStorage.getItem('wastewise_tokens');
      const storedUser = localStorage.getItem('wastewise_user');
      const tenantId = localStorage.getItem('wastewise_tenant_id');
      const tenantSubdomain = localStorage.getItem('wastewise_tenant_subdomain');

      if (storedTokens && storedUser && tenantId) {
        set({
          tokens: JSON.parse(storedTokens),
          user: JSON.parse(storedUser),
          tenantId,
          tenantSubdomain: tenantSubdomain || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    }

    set({ isLoading: false });
  },
}));

// Backward compatibility alias
export const useAuth = useAuthStore;

