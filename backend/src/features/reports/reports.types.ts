export type ReportType =
  | 'COLLECTIONS'
  | 'FINANCIAL_RECONCILIATION'
  | 'COMPLAINTS_SLA'
  | 'WARD_SUMMARY';

export type ReportFormat = 'csv' | 'pdf';

export interface ReportQueryParams {
  startDate?: string | undefined;
  endDate?: string | undefined;
  preset?: string | undefined;
  wardId?: string | undefined;
  format?: ReportFormat | undefined;
}

export interface CollectionReportRow {
  routeDate: string;
  routeStatus: string;
  wardNumber: number;
  wasteType: string;
  vehiclePlate: string;
  driverName: string;
  totalStops: number;
  collectedStops: number;
  missedStops: number;
  rejectedStops: number;
  completionRatePct: number;
}

export interface FinancialReconciliationReportRow {
  transactionReference: string;
  invoiceNumber: string;
  payerName: string;
  payerPhone: string;
  wardNumber: number | string;
  gateway: string;
  amountNpr: string;
  status: string;
  paidAt: string;
  receiptNumber: string;
}

export interface ComplaintsSlaReportRow {
  ticketNumber: string;
  wardNumber: number;
  category: string;
  priority: string;
  status: string;
  citizenName: string;
  assignedToName: string;
  isSlaBreached: string;
  createdAt: string;
  resolvedAt: string;
  resolutionHours: string;
}

export interface WardSummaryReportRow {
  wardNumber: number;
  scheduledStops: number;
  collectedStops: number;
  efficiencyPct: number;
  totalInvoicedNpr: string;
  totalCollectedNpr: string;
  openTickets: number;
  resolvedTickets: number;
  slaBreachPct: number;
  rank: number;
}

export interface ReportMetadata {
  tenantId: string;
  tenantName: string;
  reportType: ReportType;
  generatedAt: Date;
  generatedByName: string;
  periodText: string;
}

