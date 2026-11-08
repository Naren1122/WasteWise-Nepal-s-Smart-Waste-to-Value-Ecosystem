import { analyticsRepository } from './analytics.repository.js';
import { redis } from '../../shared/database/redis.service.js';
import type {
  DateRangeFilter,
  AnalyticsOverviewDto,
  CollectionMetricsDto,
  FinancialMetricsDto,
  GrievanceMetricsDto,
  FleetMetricsDto,
  WardPerformanceCardDto,
} from './analytics.types.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes

export class AnalyticsService {
  private formatDecimal(val: number): string {
    return val.toFixed(2);
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) return Number(sorted[mid]?.toFixed(1) ?? 0);
    const midVal = ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    return Number(midVal.toFixed(1));
  }

  async getExecutiveOverview(tenantId: string, filter: DateRangeFilter): Promise<AnalyticsOverviewDto> {
    const cacheKey = `t:${tenantId}:stats:overview:${filter.startDate.toISOString()}:${filter.endDate.toISOString()}:${filter.wardId ?? 'all'}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as AnalyticsOverviewDto;
    } catch {
      // Redis fallback to database query
    }

    const [collection, financial, grievance, fleet] = await Promise.all([
      this.getCollectionMetrics(tenantId, filter),
      this.getFinancialMetrics(tenantId, filter),
      this.getGrievanceMetrics(tenantId, filter),
      this.getFleetMetrics(tenantId),
    ]);

    const result: AnalyticsOverviewDto = {
      period: { startDate: filter.startDate, endDate: filter.endDate, timezone: 'Asia/Kathmandu' },
      kpis: { collection, financial, grievance, fleet },
    };

    try {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
    } catch {
      // Cache set failure non-fatal
    }

    return result;
  }

  async getCollectionMetrics(tenantId: string, filter: DateRangeFilter): Promise<CollectionMetricsDto> {
    const raw = await analyticsRepository.getCollectionCounts(tenantId, filter);
    const byStatus: Record<string, number> = {};
    let totalScheduled = 0;
    let totalCollected = 0;
    let totalMissed = 0;
    let totalRejected = 0;

    for (const s of raw.byStatus) {
      byStatus[s.status] = s._count.id;
      totalScheduled += s._count.id;
      if (s.status === 'COLLECTED') totalCollected = s._count.id;
      if (s.status === 'MISSED') totalMissed = s._count.id;
      if (s.status === 'REJECTED') totalRejected = s._count.id;
    }

    const byWasteType: Record<string, number> = {};
    for (const w of raw.byWasteType) {
      byWasteType[w.route.wasteType] = w._count.id;
    }

    const divisor = totalScheduled > 0 ? totalScheduled : 1;
    const completionRatePct = Number(((totalCollected / divisor) * 100).toFixed(2));

    return { totalScheduled, totalCollected, totalMissed, totalRejected, completionRatePct, byWasteType, byStatus };
  }

  async getFinancialMetrics(tenantId: string, filter: DateRangeFilter): Promise<FinancialMetricsDto> {
    const raw = await analyticsRepository.getFinancialAggregates(tenantId, filter);
    const totalBilledNum = Number(raw.totalBilled);
    let totalCollectedNum = 0;
    let digitalPaymentsNum = 0;
    let cashPaymentsNum = 0;
    const byGateway: Record<string, string> = {};

    for (const p of raw.paymentsByGateway) {
      const amt = Number(p._sum.amount ?? 0);
      byGateway[p.paymentGateway] = this.formatDecimal(amt);
      totalCollectedNum += amt;
      if (p.paymentGateway === 'CASH_COUNTER') cashPaymentsNum += amt;
      else digitalPaymentsNum += amt;
    }

    const outstandingNum = Math.max(0, totalBilledNum - totalCollectedNum);
    const billDivisor = totalBilledNum > 0 ? totalBilledNum : 1;
    const collDivisor = totalCollectedNum > 0 ? totalCollectedNum : 1;

    return {
      totalBilledNpr: this.formatDecimal(totalBilledNum),
      totalCollectedNpr: this.formatDecimal(totalCollectedNum),
      outstandingDuesNpr: this.formatDecimal(outstandingNum),
      collectionRatePct: Number(((totalCollectedNum / billDivisor) * 100).toFixed(2)),
      digitalPaymentsNpr: this.formatDecimal(digitalPaymentsNum),
      cashPaymentsNpr: this.formatDecimal(cashPaymentsNum),
      digitalSharePct: Number(((digitalPaymentsNum / collDivisor) * 100).toFixed(2)),
      cashSharePct: Number(((cashPaymentsNum / collDivisor) * 100).toFixed(2)),
      byGateway,
    };
  }

  async getGrievanceMetrics(tenantId: string, filter: DateRangeFilter): Promise<GrievanceMetricsDto> {
    const raw = await analyticsRepository.getGrievanceAggregates(tenantId, filter);
    const byCategory: Record<string, number> = {};
    for (const c of raw.byCategory) {
      byCategory[c.category] = c._count.id;
    }

    const totalOpen = Math.max(0, raw.totalSubmitted - raw.totalResolved);
    const divisor = raw.totalSubmitted > 0 ? raw.totalSubmitted : 1;
    const resolutionRatePct = Number(((raw.totalResolved / divisor) * 100).toFixed(2));
    const medianResolutionHours = this.calculateMedian(raw.resolutionDurationsHours);

    return {
      totalSubmitted: raw.totalSubmitted,
      totalResolved: raw.totalResolved,
      totalOpen,
      slaBreached: raw.slaBreached,
      resolutionRatePct,
      medianResolutionHours,
      byCategory,
    };
  }

  async getFleetMetrics(tenantId: string): Promise<FleetMetricsDto> {
    const counts = await analyticsRepository.getFleetCounts(tenantId);
    const available = counts['AVAILABLE'] ?? 0;
    const activeOnRoute = counts['ON_ROUTE'] ?? 0;
    const inMaintenance = counts['MAINTENANCE'] ?? 0;
    const totalVehicles = available + activeOnRoute + inMaintenance + (counts['RETIRED'] ?? 0);
    const divisor = totalVehicles > 0 ? totalVehicles : 1;
    const utilizationRatePct = Number(((activeOnRoute / divisor) * 100).toFixed(2));

    return { totalVehicles, activeOnRoute, available, inMaintenance, utilizationRatePct };
  }

  async getWardPerformance(tenantId: string, filter: DateRangeFilter): Promise<WardPerformanceCardDto[]> {
    const rawList = await analyticsRepository.getWardComparisonData(tenantId, filter);

    const cards: WardPerformanceCardDto[] = rawList.map((w) => {
      const scheduledDiv = w.stopsScheduled > 0 ? w.stopsScheduled : 1;
      const efficiency = Number(((w.stopsCollected / scheduledDiv) * 100).toFixed(2));
      const totalComplaints = w.openComplaints + w.resolvedComplaints;
      const compDiv = totalComplaints > 0 ? totalComplaints : 1;
      const breachRate = Number(((w.slaBreachedComplaints / compDiv) * 100).toFixed(2));

      return {
        wardId: w.wardId,
        wardNumber: w.wardNumber,
        officeAddress: w.officeAddress,
        contactPhone: w.contactPhone,
        scheduledStops: w.stopsScheduled,
        collectedStops: w.stopsCollected,
        collectionEfficiencyPct: efficiency,
        revenueCollectedNpr: '0.00',
        openGrievances: w.openComplaints,
        resolvedGrievances: w.resolvedComplaints,
        slaBreachRatePct: breachRate,
        rank: 0,
      };
    });

    cards.sort((a, b) => b.collectionEfficiencyPct - a.collectionEfficiencyPct);
    cards.forEach((card, idx) => {
      card.rank = idx + 1;
    });

    return cards;
  }
}

export const analyticsService = new AnalyticsService();
