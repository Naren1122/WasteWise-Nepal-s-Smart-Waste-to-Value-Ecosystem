import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsService } from '../reports.service.js';
import { prisma } from '../../../shared/database/prisma.service.js';
import { analyticsService } from '../../analytics/analytics.service.js';
import { Prisma } from '@prisma/client';

vi.mock('../../../shared/database/prisma.service.js', () => ({
  prisma: {
    tenant: { findUnique: vi.fn() },
    route: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
    complaint: { findMany: vi.fn() },
  },
}));

vi.mock('../../analytics/analytics.service.js', () => ({
  analyticsService: {
    getWardPerformance: vi.fn(),
  },
}));

describe('ReportsService', () => {
  let service: ReportsService;
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const filter = {
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2026-11-07T23:59:59.999Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReportsService();
  });

  describe('getTenantInfo', () => {
    it('returns tenant municipal name', async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
        id: tenantId,
        name: 'Kathmandu Metropolitan City',
      } as any);

      const info = await service.getTenantInfo(tenantId);
      expect(info.name).toBe('Kathmandu Metropolitan City');
    });
  });

  describe('getCollectionsReportData', () => {
    it('aggregates daily route stops and formats completion percentage', async () => {
      vi.mocked(prisma.route.findMany).mockResolvedValueOnce([
        {
          id: 'route-1',
          tenantId,
          routeDate: new Date('2026-11-05T00:00:00.000Z'),
          status: 'COMPLETED',
          wasteType: 'ORGANIC',
          ward: { wardNumber: 3 },
          vehicle: { registrationNo: 'BA-2-KHA-1234' },
          driver: { fullName: 'Bikram Thapa' },
          stops: [
            { status: 'COLLECTED' },
            { status: 'COLLECTED' },
            { status: 'COLLECTED' },
            { status: 'MISSED' },
          ],
        },
      ] as any);

      const report = await service.getCollectionsReportData(tenantId, filter);

      expect(report).toHaveLength(1);
      const row = report[0]!;
      expect(row.routeDate).toBe('2026-11-05');
      expect(row.routeStatus).toBe('COMPLETED');
      expect(row.wardNumber).toBe(3);
      expect(row.wasteType).toBe('ORGANIC');
      expect(row.vehiclePlate).toBe('BA-2-KHA-1234');
      expect(row.driverName).toBe('Bikram Thapa');
      expect(row.totalStops).toBe(4);
      expect(row.collectedStops).toBe(3);
      expect(row.missedStops).toBe(1);
      expect(row.completionRatePct).toBe(75);
    });
  });

  describe('getFinancialReconciliationData', () => {
    it('formats transaction ledgers and payment gateway records', async () => {
      vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([
        {
          id: 'pay-1',
          transactionReference: 'TXN-WW-2026-9901',
          paymentGateway: 'ESEWA',
          amount: new Prisma.Decimal('1250.00'),
          status: 'SUCCESS',
          paidAt: new Date('2026-11-03T10:30:00.000Z'),
          receiptNumber: 'RCP-1001',
          invoice: {
            invoiceNumber: 'INV-2026-001',
            property: { ward: { wardNumber: 4 } },
          },
          payer: {
            fullName: 'Sita Shrestha',
            phone: '+9779841000000',
          },
        },
      ] as any);

      const report = await service.getFinancialReconciliationData(tenantId, filter);

      expect(report).toHaveLength(1);
      const row = report[0]!;
      expect(row.transactionReference).toBe('TXN-WW-2026-9901');
      expect(row.invoiceNumber).toBe('INV-2026-001');
      expect(row.payerName).toBe('Sita Shrestha');
      expect(row.wardNumber).toBe(4);
      expect(row.gateway).toBe('ESEWA');
      expect(row.amountNpr).toBe('1250.00');
      expect(row.receiptNumber).toBe('RCP-1001');
    });
  });

  describe('getComplaintsSlaReportData', () => {
    it('computes turnaround hours and marks SLA breach flags', async () => {
      const createdAt = new Date('2026-11-02T08:00:00.000Z');
      const resolvedAt = new Date('2026-11-02T20:00:00.000Z'); // 12 hours later

      vi.mocked(prisma.complaint.findMany).mockResolvedValueOnce([
        {
          id: 'ticket-1',
          ticketNumber: 'WW-GRV-2611-1005',
          category: 'MISSED_PICKUP',
          priority: 'HIGH',
          status: 'RESOLVED',
          isSlaBreached: false,
          createdAt,
          resolvedAt,
          ward: { wardNumber: 2 },
          citizen: { fullName: 'Ram Bahadur' },
          assignedTo: { fullName: 'Inspector Karki' },
        },
      ] as any);

      const report = await service.getComplaintsSlaReportData(tenantId, filter);

      expect(report).toHaveLength(1);
      const row = report[0]!;
      expect(row.ticketNumber).toBe('WW-GRV-2611-1005');
      expect(row.wardNumber).toBe(2);
      expect(row.citizenName).toBe('Ram Bahadur');
      expect(row.assignedToName).toBe('Inspector Karki');
      expect(row.isSlaBreached).toBe('NO');
      expect(row.resolutionHours).toBe('12.0');
    });
  });

  describe('getWardSummaryReportData', () => {
    it('maps ward ranking cards into summary report rows', async () => {
      vi.mocked(analyticsService.getWardPerformance).mockResolvedValueOnce([
        {
          wardId: 'w-1',
          wardNumber: 1,
          officeAddress: 'Main St',
          contactPhone: '9841',
          scheduledStops: 50,
          collectedStops: 48,
          collectionEfficiencyPct: 96,
          revenueCollectedNpr: '15000.00',
          openGrievances: 1,
          resolvedGrievances: 9,
          slaBreachRatePct: 10,
          rank: 1,
        },
      ]);

      const report = await service.getWardSummaryReportData(tenantId, filter);

      expect(report).toHaveLength(1);
      const row = report[0]!;
      expect(row.wardNumber).toBe(1);
      expect(row.efficiencyPct).toBe(96);
      expect(row.rank).toBe(1);
      expect(row.openTickets).toBe(1);
      expect(row.resolvedTickets).toBe(9);
    });
  });
});

