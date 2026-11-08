import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../analytics.service.js';
import { analyticsRepository } from '../analytics.repository.js';
import { redis } from '../../../shared/database/redis.service.js';
import { Prisma } from '@prisma/client';

vi.mock('../analytics.repository.js', () => ({
  analyticsRepository: {
    getCollectionCounts: vi.fn(),
    getFinancialAggregates: vi.fn(),
    getGrievanceAggregates: vi.fn(),
    getFleetCounts: vi.fn(),
    getWardComparisonData: vi.fn(),
  },
}));

vi.mock('../../../shared/database/redis.service.js', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const filter = {
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2026-11-07T23:59:59.999Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AnalyticsService();
  });

  describe('getCollectionMetrics', () => {
    it('calculates completion rate and outcome breakdown correctly', async () => {
      vi.mocked(analyticsRepository.getCollectionCounts).mockResolvedValueOnce({
        byStatus: [
          { status: 'COLLECTED', _count: { id: 80 } },
          { status: 'MISSED', _count: { id: 15 } },
          { status: 'REJECTED', _count: { id: 5 } },
        ],
        byWasteType: [
          { route: { wasteType: 'ORGANIC' }, _count: { id: 60 } },
          { route: { wasteType: 'RECYCLABLE' }, _count: { id: 40 } },
        ],
      });

      const metrics = await service.getCollectionMetrics(tenantId, filter);

      expect(metrics.totalScheduled).toBe(100);
      expect(metrics.totalCollected).toBe(80);
      expect(metrics.totalMissed).toBe(15);
      expect(metrics.totalRejected).toBe(5);
      expect(metrics.completionRatePct).toBe(80);
      expect(metrics.byWasteType['ORGANIC']).toBe(60);
    });

    it('handles zero scheduled stops without division by zero', async () => {
      vi.mocked(analyticsRepository.getCollectionCounts).mockResolvedValueOnce({
        byStatus: [],
        byWasteType: [],
      });

      const metrics = await service.getCollectionMetrics(tenantId, filter);

      expect(metrics.totalScheduled).toBe(0);
      expect(metrics.completionRatePct).toBe(0);
    });
  });

  describe('getFinancialMetrics', () => {
    it('aggregates revenue, outstanding dues, and payment gateway splits', async () => {
      vi.mocked(analyticsRepository.getFinancialAggregates).mockResolvedValueOnce({
        totalBilled: new Prisma.Decimal('50000.00'),
        paymentsByGateway: [
          { paymentGateway: 'ESEWA', _sum: { amount: new Prisma.Decimal('25000.00') } },
          { paymentGateway: 'KHALTI', _sum: { amount: new Prisma.Decimal('10000.00') } },
          { paymentGateway: 'CASH_COUNTER', _sum: { amount: new Prisma.Decimal('5000.00') } },
        ],
      });

      const finances = await service.getFinancialMetrics(tenantId, filter);

      expect(finances.totalBilledNpr).toBe('50000.00');
      expect(finances.totalCollectedNpr).toBe('40000.00');
      expect(finances.outstandingDuesNpr).toBe('10000.00');
      expect(finances.collectionRatePct).toBe(80);
      expect(finances.digitalPaymentsNpr).toBe('35000.00');
      expect(finances.cashPaymentsNpr).toBe('5000.00');
      expect(finances.digitalSharePct).toBe(87.5);
      expect(finances.cashSharePct).toBe(12.5);
    });
  });

  describe('getGrievanceMetrics', () => {
    it('calculates resolution rate and median turnaround time', async () => {
      vi.mocked(analyticsRepository.getGrievanceAggregates).mockResolvedValueOnce({
        totalSubmitted: 20,
        totalResolved: 16,
        slaBreached: 2,
        byCategory: [{ category: 'MISSED_PICKUP', _count: { id: 20 } }],
        resolutionDurationsHours: [10, 12, 14, 18, 20],
      });

      const grievance = await service.getGrievanceMetrics(tenantId, filter);

      expect(grievance.totalSubmitted).toBe(20);
      expect(grievance.totalResolved).toBe(16);
      expect(grievance.totalOpen).toBe(4);
      expect(grievance.resolutionRatePct).toBe(80);
      expect(grievance.medianResolutionHours).toBe(14);
    });
  });

  describe('getFleetMetrics', () => {
    it('calculates active fleet utilization percentage', async () => {
      vi.mocked(analyticsRepository.getFleetCounts).mockResolvedValueOnce({
        AVAILABLE: 3,
        ON_ROUTE: 6,
        MAINTENANCE: 1,
        RETIRED: 0,
      });

      const fleet = await service.getFleetMetrics(tenantId);

      expect(fleet.totalVehicles).toBe(10);
      expect(fleet.activeOnRoute).toBe(6);
      expect(fleet.utilizationRatePct).toBe(60);
    });
  });

  describe('getExecutiveOverview', () => {
    it('serves cached summary when available in Redis', async () => {
      const cachedPayload = {
        period: {
          startDate: '2026-11-01T00:00:00.000Z',
          endDate: '2026-11-07T23:59:59.999Z',
          timezone: 'Asia/Kathmandu',
        },
        kpis: {
          collection: { totalScheduled: 10, totalCollected: 10, completionRatePct: 100 },
        },
      };
      vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(cachedPayload));

      const overview = await service.getExecutiveOverview(tenantId, filter);

      expect(overview).toEqual(cachedPayload);
      expect(analyticsRepository.getCollectionCounts).not.toHaveBeenCalled();
    });
  });
});
