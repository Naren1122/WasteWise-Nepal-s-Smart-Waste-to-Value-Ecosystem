import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';
import { Property, PropertyStatus, PropertyType } from './useProperties';

export interface AdminPropertyFilters {
  wardId?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPropertiesResult {
  data: Property[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function useAdminProperties(filters: AdminPropertyFilters = {}) {
  const { wardId, propertyType, status, page = 1, pageSize = 20 } = filters;

  return useQuery<PaginatedPropertiesResult>({
    queryKey: ['admin-properties', { wardId, propertyType, status, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (wardId) params.append('wardId', wardId);
      if (propertyType) params.append('propertyType', propertyType);
      if (status) params.append('status', status);
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));

      const response = await apiClient.get<Property[]>(`/properties?${params.toString()}`);
      
      // In PaginatedResponse envelope from backend:
      // response.data holds the items array, and response.pagination holds the metadata
      const rawRes = response as unknown as {
        data: Property[];
        pagination: PaginatedPropertiesResult['pagination'];
      };

      return {
        data: rawRes.data || [],
        pagination: rawRes.pagination || {
          page,
          pageSize,
          totalItems: rawRes.data?.length || 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    },
    staleTime: 30 * 1000,
  });
}

export interface UpdatePropertyStatusInput {
  propertyId: string;
  status: PropertyStatus;
  verificationNotes?: string;
}

export function useUpdatePropertyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, status, verificationNotes }: UpdatePropertyStatusInput) => {
      const response = await apiClient.patch<Property>(`/properties/${propertyId}/status`, {
        status,
        verificationNotes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    },
  });
}

