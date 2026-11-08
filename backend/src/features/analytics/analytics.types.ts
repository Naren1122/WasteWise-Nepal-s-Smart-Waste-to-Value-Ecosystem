export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
  wardId?: string | undefined;
}

export interface CollectionMetricsDto {
  totalScheduled: number;
  totalCollected: number;
  totalMissed: number;
  totalRejected: number;
  completionRatePct: number;
  byWasteType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface FinancialMetricsDto {
  totalBilledNpr: string;
  totalCollectedNpr: string;
  outstandingDuesNpr: string;
  collectionRatePct: number;
  digitalPaymentsNpr: string;
  cashPaymentsNpr: string;
  digitalSharePct: number;
  cashSharePct: number;
  byGateway: Record<string, string>;
}

export interface GrievanceMetricsDto {
  totalSubmitted: number;
  totalResolved: number;
  totalOpen: number;
  slaBreached: number;
  resolutionRatePct: number;
  medianResolutionHours: number;
  byCategory: Record<string, number>;
}

export interface FleetMetricsDto {
  totalVehicles: number;
  activeOnRoute: number;
  available: number;
  inMaintenance: number;
  utilizationRatePct: number;
}

export interface AnalyticsOverviewDto {
  period: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  kpis: {
    collection: CollectionMetricsDto;
    financial: FinancialMetricsDto;
    grievance: GrievanceMetricsDto;
    fleet: FleetMetricsDto;
  };
}

export interface WardPerformanceCardDto {
  wardId: string;
  wardNumber: number;
  officeAddress: string | null;
  contactPhone: string | null;
  scheduledStops: number;
  collectedStops: number;
  collectionEfficiencyPct: number;
  revenueCollectedNpr: string;
  openGrievances: number;
  resolvedGrievances: number;
  slaBreachRatePct: number;
  rank: number;
}

export interface DailyTrendPointDto {
  date: string;
  stopsScheduled: number;
  stopsCollected: number;
  stopsMissed: number;
  revenueCollectedNpr: number;
  complaintsLogged: number;
  complaintsResolved: number;
}

