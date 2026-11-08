import type { Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { reportsService, ReportsService } from './reports.service.js';
import { ReportExportQuerySchema } from './reports.schema.js';
import { resolveDateRange } from '../../shared/utils/date-range.util.js';
import { streamCsvResponse, CsvColumn } from '../../shared/utils/csv-exporter.js';
import { logAuditEvent } from '../../shared/utils/audit-logger.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';
import type {
  CollectionReportRow,
  FinancialReconciliationReportRow,
  ComplaintsSlaReportRow,
  WardSummaryReportRow,
} from './reports.types.js';

export class ReportsController {
  constructor(private readonly service: ReportsService = reportsService) {}

  private extractContext(req: Request): { tenantId: string; userId?: string | undefined; role?: Role | undefined } {
    if (!req.tenant?.id) throw new UnauthorizedError('Tenant context is required');
    return {
      tenantId: req.tenant.id,
      userId: req.user?.id,
      role: req.user?.role,
    };
  }

  public exportCollections = async (req: Request, res: Response): Promise<void> => {
    const { tenantId, userId, role } = this.extractContext(req);
    const query = ReportExportQuerySchema.parse(req.query);
    const range = resolveDateRange({ startDate: query.startDate, endDate: query.endDate, preset: query.preset });

    const rows = await this.service.getCollectionsReportData(tenantId, {
      startDate: range.startDate,
      endDate: range.endDate,
      wardId: query.wardId,
    });

    const columns: CsvColumn<CollectionReportRow>[] = [
      { header: 'Route Date', accessor: (r) => r.routeDate },
      { header: 'Route Status', accessor: (r) => r.routeStatus },
      { header: 'Ward Number', accessor: (r) => r.wardNumber },
      { header: 'Waste Type', accessor: (r) => r.wasteType },
      { header: 'Vehicle Plate', accessor: (r) => r.vehiclePlate },
      { header: 'Driver Name', accessor: (r) => r.driverName },
      { header: 'Total Stops', accessor: (r) => r.totalStops },
      { header: 'Collected Stops', accessor: (r) => r.collectedStops },
      { header: 'Missed Stops', accessor: (r) => r.missedStops },
      { header: 'Rejected Stops', accessor: (r) => r.rejectedStops },
      { header: 'Completion %', accessor: (r) => `${r.completionRatePct}%` },
    ];

    const filename = `collections-report-${range.startDate.toISOString().slice(0, 10)}.csv`;
    streamCsvResponse(res, filename, columns, rows);

    logAuditEvent({
      tenantId,
      actorUserId: userId,
      actorRole: role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      entityType: 'Report',
      entityId: 'COLLECTIONS',
      action: 'EXPORT_GENERATED',
      description: `Exported collections CSV (${rows.length} rows)`,
    });
  };

  public exportFinancialReconciliation = async (req: Request, res: Response): Promise<void> => {
    const { tenantId, userId, role } = this.extractContext(req);
    const query = ReportExportQuerySchema.parse(req.query);
    const range = resolveDateRange({ startDate: query.startDate, endDate: query.endDate, preset: query.preset });

    const rows = await this.service.getFinancialReconciliationData(tenantId, {
      startDate: range.startDate,
      endDate: range.endDate,
    });

    const columns: CsvColumn<FinancialReconciliationReportRow>[] = [
      { header: 'Transaction Ref', accessor: (r) => r.transactionReference },
      { header: 'Invoice Number', accessor: (r) => r.invoiceNumber },
      { header: 'Payer Name', accessor: (r) => r.payerName },
      { header: 'Payer Phone', accessor: (r) => r.payerPhone },
      { header: 'Ward Number', accessor: (r) => r.wardNumber },
      { header: 'Payment Gateway', accessor: (r) => r.gateway },
      { header: 'Amount (NPR)', accessor: (r) => r.amountNpr },
      { header: 'Payment Status', accessor: (r) => r.status },
      { header: 'Paid At', accessor: (r) => r.paidAt },
      { header: 'Receipt Number', accessor: (r) => r.receiptNumber },
    ];

    const filename = `financial-reconciliation-${range.startDate.toISOString().slice(0, 10)}.csv`;
    streamCsvResponse(res, filename, columns, rows);

    logAuditEvent({
      tenantId,
      actorUserId: userId,
      actorRole: role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      entityType: 'Report',
      entityId: 'FINANCIAL_RECONCILIATION',
      action: 'EXPORT_GENERATED',
      description: `Exported financial reconciliation CSV (${rows.length} rows)`,
    });
  };

  public exportComplaintsSla = async (req: Request, res: Response): Promise<void> => {
    const { tenantId, userId, role } = this.extractContext(req);
    const query = ReportExportQuerySchema.parse(req.query);
    const range = resolveDateRange({ startDate: query.startDate, endDate: query.endDate, preset: query.preset });

    const rows = await this.service.getComplaintsSlaReportData(tenantId, {
      startDate: range.startDate,
      endDate: range.endDate,
      wardId: query.wardId,
    });

    const columns: CsvColumn<ComplaintsSlaReportRow>[] = [
      { header: 'Ticket Number', accessor: (r) => r.ticketNumber },
      { header: 'Ward Number', accessor: (r) => r.wardNumber },
      { header: 'Category', accessor: (r) => r.category },
      { header: 'Priority', accessor: (r) => r.priority },
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Citizen Name', accessor: (r) => r.citizenName },
      { header: 'Assigned To', accessor: (r) => r.assignedToName },
      { header: 'SLA Breached', accessor: (r) => r.isSlaBreached },
      { header: 'Created At', accessor: (r) => r.createdAt },
      { header: 'Resolved At', accessor: (r) => r.resolvedAt },
      { header: 'Turnaround (Hours)', accessor: (r) => r.resolutionHours },
    ];

    const filename = `complaints-sla-report-${range.startDate.toISOString().slice(0, 10)}.csv`;
    streamCsvResponse(res, filename, columns, rows);

    logAuditEvent({
      tenantId,
      actorUserId: userId,
      actorRole: role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      entityType: 'Report',
      entityId: 'COMPLAINTS_SLA',
      action: 'EXPORT_GENERATED',
      description: `Exported complaints SLA CSV (${rows.length} rows)`,
    });
  };

  public exportWardSummary = async (req: Request, res: Response): Promise<void> => {
    const { tenantId, userId, role } = this.extractContext(req);
    const query = ReportExportQuerySchema.parse(req.query);
    const range = resolveDateRange({ startDate: query.startDate, endDate: query.endDate, preset: query.preset });

    const rows = await this.service.getWardSummaryReportData(tenantId, {
      startDate: range.startDate,
      endDate: range.endDate,
    });

    const columns: CsvColumn<WardSummaryReportRow>[] = [
      { header: 'Rank', accessor: (r) => r.rank },
      { header: 'Ward Number', accessor: (r) => r.wardNumber },
      { header: 'Scheduled Stops', accessor: (r) => r.scheduledStops },
      { header: 'Collected Stops', accessor: (r) => r.collectedStops },
      { header: 'Efficiency %', accessor: (r) => `${r.efficiencyPct}%` },
      { header: 'Revenue NPR', accessor: (r) => r.totalCollectedNpr },
      { header: 'Open Grievances', accessor: (r) => r.openTickets },
      { header: 'Resolved Grievances', accessor: (r) => r.resolvedTickets },
      { header: 'SLA Breach %', accessor: (r) => `${r.slaBreachPct}%` },
    ];

    const filename = `ward-summary-${range.startDate.toISOString().slice(0, 10)}.csv`;
    streamCsvResponse(res, filename, columns, rows);

    logAuditEvent({
      tenantId,
      actorUserId: userId,
      actorRole: role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      entityType: 'Report',
      entityId: 'WARD_SUMMARY',
      action: 'EXPORT_GENERATED',
      description: `Exported ward summary CSV (${rows.length} rows)`,
    });
  };
}

export const reportsController = new ReportsController();
