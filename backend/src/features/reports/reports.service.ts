import { prisma } from '../../shared/database/prisma.service.js';
import { analyticsService } from '../analytics/analytics.service.js';
import type { DateRangeFilter } from '../analytics/analytics.types.js';
import type {
  CollectionReportRow,
  FinancialReconciliationReportRow,
  ComplaintsSlaReportRow,
  WardSummaryReportRow,
} from './reports.types.js';

export class ReportsService {
  async getTenantInfo(tenantId: string): Promise<{ name: string }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    return { name: tenant?.name ?? 'WasteWise Municipality' };
  }

  async getCollectionsReportData(tenantId: string, filter: DateRangeFilter): Promise<CollectionReportRow[]> {
    const routes = await prisma.route.findMany({
      where: {
        tenantId,
        routeDate: { gte: filter.startDate, lte: filter.endDate },
        ...(filter.wardId ? { wardId: filter.wardId } : {}),
      },
      include: {
        ward: { select: { wardNumber: true } },
        vehicle: { select: { registrationNo: true } },
        driver: { select: { fullName: true } },
        stops: { select: { status: true } },
      },
      orderBy: { routeDate: 'desc' },
      take: 2000,
    });

    return routes.map((r) => {
      let collected = 0;
      let missed = 0;
      let rejected = 0;

      for (const s of r.stops) {
        if (s.status === 'COLLECTED') collected++;
        else if (s.status === 'MISSED') missed++;
        else if (s.status === 'REJECTED') rejected++;
      }

      const totalStops = r.stops.length;
      const completionRatePct = totalStops > 0 ? Number(((collected / totalStops) * 100).toFixed(2)) : 0;

      return {
        routeDate: r.routeDate.toISOString().slice(0, 10),
        routeStatus: r.status,
        wardNumber: r.ward.wardNumber,
        wasteType: r.wasteType,
        vehiclePlate: r.vehicle?.registrationNo ?? 'UNASSIGNED',
        driverName: r.driver?.fullName ?? 'UNASSIGNED',
        totalStops,
        collectedStops: collected,
        missedStops: missed,
        rejectedStops: rejected,
        completionRatePct,
      };
    });
  }

  async getFinancialReconciliationData(
    tenantId: string,
    filter: DateRangeFilter
  ): Promise<FinancialReconciliationReportRow[]> {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: 'SUCCESS',
        paidAt: { gte: filter.startDate, lte: filter.endDate },
      },
      include: {
        invoice: { select: { invoiceNumber: true, property: { select: { ward: { select: { wardNumber: true } } } } } },
        payer: { select: { fullName: true, phone: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: 3000,
    });

    return payments.map((p) => ({
      transactionReference: p.transactionReference,
      invoiceNumber: p.invoice.invoiceNumber,
      payerName: p.payer.fullName,
      payerPhone: p.payer.phone,
      wardNumber: p.invoice.property.ward.wardNumber,
      gateway: p.paymentGateway,
      amountNpr: Number(p.amount).toFixed(2),
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString() : '',
      receiptNumber: p.receiptNumber ?? 'N/A',
    }));
  }

  async getComplaintsSlaReportData(tenantId: string, filter: DateRangeFilter): Promise<ComplaintsSlaReportRow[]> {
    const complaints = await prisma.complaint.findMany({
      where: {
        tenantId,
        createdAt: { gte: filter.startDate, lte: filter.endDate },
        ...(filter.wardId ? { wardId: filter.wardId } : {}),
      },
      include: {
        ward: { select: { wardNumber: true } },
        citizen: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });

    return complaints.map((c) => {
      let resolutionHours = 'N/A';
      if (c.resolvedAt) {
        const hours = (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
        resolutionHours = hours.toFixed(1);
      }

      return {
        ticketNumber: c.ticketNumber,
        wardNumber: c.ward.wardNumber,
        category: c.category,
        priority: c.priority,
        status: c.status,
        citizenName: c.citizen.fullName,
        assignedToName: c.assignedTo?.fullName ?? 'UNASSIGNED',
        isSlaBreached: c.isSlaBreached ? 'YES' : 'NO',
        createdAt: c.createdAt.toISOString(),
        resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : 'PENDING',
        resolutionHours,
      };
    });
  }

  async getWardSummaryReportData(tenantId: string, filter: DateRangeFilter): Promise<WardSummaryReportRow[]> {
    const cards = await analyticsService.getWardPerformance(tenantId, filter);
    return cards.map((c) => ({
      wardNumber: c.wardNumber,
      scheduledStops: c.scheduledStops,
      collectedStops: c.collectedStops,
      efficiencyPct: c.collectionEfficiencyPct,
      totalInvoicedNpr: '0.00',
      totalCollectedNpr: c.revenueCollectedNpr,
      openTickets: c.openGrievances,
      resolvedTickets: c.resolvedGrievances,
      slaBreachPct: c.slaBreachRatePct,
      rank: c.rank,
    }));
  }
}

export const reportsService = new ReportsService();
