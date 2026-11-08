import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import type {
  AnalyticsOverviewDto,
  WardPerformanceCardDto,
  AnalyticsQueryFilters,
} from '../types/analytics.types';

function buildQueryString(filters?: AnalyticsQueryFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();

  if (filters.preset) params.set('preset', filters.preset);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.wardId && filters.wardId !== 'all') params.set('wardId', filters.wardId);

  const str = params.toString();
  return str ? `?${str}` : '';
}

export function useAnalyticsOverview(filters?: AnalyticsQueryFilters) {
  return useQuery<AnalyticsOverviewDto>({
    queryKey: ['analytics', 'overview', filters],
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const res = await apiClient.get<AnalyticsOverviewDto>(`/analytics/overview${qs}`);
      return res.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useWardPerformance(filters?: AnalyticsQueryFilters) {
  return useQuery<WardPerformanceCardDto[]>({
    queryKey: ['analytics', 'wards', filters],
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const res = await apiClient.get<WardPerformanceCardDto[]>(`/analytics/wards${qs}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useSingleWardCard(wardId?: string, filters?: AnalyticsQueryFilters) {
  return useQuery<WardPerformanceCardDto>({
    queryKey: ['analytics', 'ward', wardId, filters],
    queryFn: async () => {
      if (!wardId) throw new Error('Ward ID is required');
      const qs = buildQueryString(filters);
      const res = await apiClient.get<WardPerformanceCardDto>(`/analytics/wards/${wardId}${qs}`);
      return res.data;
    },
    enabled: Boolean(wardId && wardId !== 'all'),
    staleTime: 60 * 1000,
  });
}
