import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { toast } from '@/shared/components/ui/sonner';

export interface OnboardTenantInput {
  municipalityName: string;
  subdomain: string;
  province: string;
  district: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
}

export interface OnboardTenantResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export function useMunicipalityOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OnboardTenantInput) => {
      return apiClient.post<OnboardTenantResponse>('/tenants/onboard', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['municipalities'] });
      const tenant = res.data?.tenant;
      toast.success('Municipality onboarded successfully', {
        description: tenant ? `${tenant.name} (${tenant.subdomain}) is now live.` : 'Tenant provisioned.',
      });
    },
    onError: (err: unknown) => {
      toast.error('Failed to onboard municipality', {
        description: err instanceof Error ? err.message : 'Please verify details and try again.',
      });
    },
  });
}

