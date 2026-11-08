import { prisma } from '../../shared/database/prisma.service.js';
import { DateRangeFilter } from './analytics.types.js';
import { Prisma, StopStatus, WasteType, ComplaintCategory, PaymentGateway } from '@prisma/client';

export class AnalyticsRepository {
  async getCollectionCounts(tenantId: string, filter: DateRangeFilter): Promise<{
    byStatus: Array<{ status: StopStatus; _count: { id: number } }>;
    byWasteType: Array<{ route: { wasteType: WasteType }; _count: { id: number } }>;
  }> {
    const routeWhere: Prisma.RouteWhereInput = {
      tenantId,
      routeDate: { gte: filter.startDate, lte: filter.endDate },
      ...(filter.wardId ? { wardId: filter.wardId } : {}),
    };

    const [byStatus, byWasteType] = await Promise.all([
      prisma.routeStop.groupBy({
        by: ['status'],
        where: { tenantId, route: routeWhere },
        _count: { id: true },
      }),
      prisma.route.findMany({
        where: routeWhere,
        select: { wasteType: true, _count: { select: { stops: true } } },
      }).then((routes) => {
        const wasteMap = new Map<WasteType, number>();
        for (const r of routes) {
          wasteMap.set(r.wasteType, (wasteMap.get(r.wasteType) ?? 0) + r._count.stops);
        }
        return Array.from(wasteMap.entries()).map(([wt, count]) => ({
          route: { wasteType: wt },
          _count: { id: count },
        }));
      }),
    ]);

    return { byStatus, byWasteType };
  }

  async getFinancialAggregates(tenantId: string, filter: DateRangeFilter): Promise<{
    totalBilled: Prisma.Decimal;
    paymentsByGateway: Array<{ paymentGateway: PaymentGateway; _sum: { amount: Prisma.Decimal | null } }>;
  }> {
    const [billedAgg, paymentsByGateway] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          createdAt: { gte: filter.startDate, lte: filter.endDate },
          status: { notIn: ['CANCELLED', 'DRAFT'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentGateway'],
        where: {
          tenantId,
          status: 'SUCCESS',
          paidAt: { gte: filter.startDate, lte: filter.endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalBilled: billedAgg._sum?.totalAmount ? new Prisma.Decimal(billedAgg._sum.totalAmount) : new Prisma.Decimal(0),
      paymentsByGateway,
    };
  }

  async getGrievanceAggregates(tenantId: string, filter: DateRangeFilter): Promise<{
    byCategory: Array<{ category: ComplaintCategory; _count: { id: number } }>;
    totalSubmitted: number;
    totalResolved: number;
    slaBreached: number;
    resolutionDurationsHours: number[];
  }> {
    const where: Prisma.ComplaintWhereInput = {
      tenantId,
      createdAt: { gte: filter.startDate, lte: filter.endDate },
      ...(filter.wardId ? { wardId: filter.wardId } : {}),
    };

    const [byCategory, totalSubmitted, totalResolved, slaBreached, resolvedTickets] = await Promise.all([
      prisma.complaint.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
      }),
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.complaint.count({ where: { ...where, isSlaBreached: true } }),
      prisma.complaint.findMany({
        where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        take: 500,
      }),
    ]);

    const resolutionDurationsHours = resolvedTickets
      .filter((t) => t.resolvedAt !== null)
      .map((t) => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60));

    return {
      byCategory,
      totalSubmitted,
      totalResolved,
      slaBreached,
      resolutionDurationsHours,
    };
  }

  async getFleetCounts(tenantId: string): Promise<Record<string, number>> {
    const vehicles = await prisma.vehicle.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    });

    const counts: Record<string, number> = { AVAILABLE: 0, ON_ROUTE: 0, MAINTENANCE: 0, RETIRED: 0 };
    for (const v of vehicles) {
      counts[v.status] = v._count.id;
    }
    return counts;
  }

  async getWardComparisonData(tenantId: string, filter: DateRangeFilter): Promise<Array<{
    wardId: string;
    wardNumber: number;
    officeAddress: string | null;
    contactPhone: string | null;
    stopsScheduled: number;
    stopsCollected: number;
    openComplaints: number;
    resolvedComplaints: number;
    slaBreachedComplaints: number;
  }>> {
    const wards = await prisma.ward.findMany({
      where: { tenantId },
      select: { id: true, wardNumber: true, officeAddress: true, contactPhone: true },
      orderBy: { wardNumber: 'asc' },
    });

    return Promise.all(
      wards.map(async (w) => {
        const [stopsScheduled, stopsCollected, openComplaints, resolvedComplaints, slaBreachedComplaints] =
          await Promise.all([
            prisma.routeStop.count({
              where: { tenantId, route: { wardId: w.id, routeDate: { gte: filter.startDate, lte: filter.endDate } } },
            }),
            prisma.routeStop.count({
              where: { tenantId, status: 'COLLECTED', route: { wardId: w.id, routeDate: { gte: filter.startDate, lte: filter.endDate } } },
            }),
            prisma.complaint.count({
              where: { tenantId, wardId: w.id, status: { notIn: ['RESOLVED', 'REJECTED', 'CLOSED'] } },
            }),
            prisma.complaint.count({
              where: { tenantId, wardId: w.id, status: { in: ['RESOLVED', 'CLOSED'] }, createdAt: { gte: filter.startDate, lte: filter.endDate } },
            }),
            prisma.complaint.count({
              where: { tenantId, wardId: w.id, isSlaBreached: true, createdAt: { gte: filter.startDate, lte: filter.endDate } },
            }),
          ]);

        return {
          wardId: w.id,
          wardNumber: w.wardNumber,
          officeAddress: w.officeAddress,
          contactPhone: w.contactPhone,
          stopsScheduled,
          stopsCollected,
          openComplaints,
          resolvedComplaints,
          slaBreachedComplaints,
        };
      })
    );
  }
}

export const analyticsRepository = new AnalyticsRepository();
