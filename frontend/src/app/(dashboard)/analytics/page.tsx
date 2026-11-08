'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useAnalyticsOverview, useWardPerformance } from '@/features/analytics/api/useAnalytics';
import { WardLeaderboardTable } from '@/features/analytics/components/WardLeaderboardTable';
import type { DatePreset } from '@/features/analytics/types/analytics.types';
import {
  TrendingUp,
  Wallet,
  AlertCircle,
  Truck,
  RefreshCw,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';

const PRESET_OPTIONS: Array<{ label: string; value: DatePreset }> = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Fiscal Year', value: 'this_fiscal_year' },
];

export default function AnalyticsDashboardPage() {
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [, startTransition] = useTransition();

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview, isFetching } = useAnalyticsOverview({ preset });
  const { data: wards, isLoading: wardsLoading } = useWardPerformance({ preset });

  const handlePresetChange = (newPreset: DatePreset) => {
    startTransition(() => {
      setPreset(newPreset);
    });
  };

  const kpis = overview?.kpis;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Municipal Analytics & Performance
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-500 mt-1">
            Real-time operations, revenue settlement, fleet & citizen grievance KPIs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePresetChange(opt.value)}
              className={`h-9 px-3 text-[13px] font-medium rounded-lg transition-colors min-h-[40px] sm:min-h-[36px] ${
                preset === opt.value
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOverview()}
            disabled={isFetching}
            className="h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Link href="/reports">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (Responsive: 1-col mobile, 2-col tablet, 4-col desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Collection Rate */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
              Collection Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-slate-900">
              {overviewLoading ? '--' : `${kpis?.collection.completionRatePct ?? 0}%`}
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {kpis?.collection.totalCollected.toLocaleString()} of {kpis?.collection.totalScheduled.toLocaleString()} stops
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">Missed: {kpis?.collection.totalMissed ?? 0}</span>
            <Badge variant="active">Operational</Badge>
          </div>
        </Card>

        {/* Card 2: Revenue Collected */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
              Revenue Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-slate-900">
              {overviewLoading ? '--' : `रू ${kpis?.financial.totalCollectedNpr ?? '0.00'}`}
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Outstanding: रू {kpis?.financial.outstandingDuesNpr ?? '0.00'}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">Digital: {kpis?.financial.digitalSharePct ?? 0}%</span>
            <Badge variant="info">Settled</Badge>
          </div>
        </Card>

        {/* Card 3: Grievance Resolution */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
              Grievance SLA
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-slate-900">
              {overviewLoading ? '--' : `${kpis?.grievance.resolutionRatePct ?? 0}%`}
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {kpis?.grievance.totalResolved} resolved, {kpis?.grievance.totalOpen} pending
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {kpis?.grievance.medianResolutionHours ?? 0}h median
            </span>
            <Badge variant={kpis && kpis.grievance.slaBreached > 0 ? 'pending' : 'active'}>
              {kpis?.grievance.slaBreached ?? 0} Breached
            </Badge>
          </div>
        </Card>

        {/* Card 4: Fleet Utilization */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
              Fleet on Route
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-bold text-slate-900">
              {overviewLoading ? '--' : `${kpis?.fleet.utilizationRatePct ?? 0}%`}
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {kpis?.fleet.activeOnRoute} of {kpis?.fleet.totalVehicles} active trucks
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">Maint: {kpis?.fleet.inMaintenance ?? 0}</span>
            <Badge variant="default">Fleet Live</Badge>
          </div>
        </Card>
      </div>

      {/* Ward Performance Leaderboard Sub-Component */}
      <WardLeaderboardTable wards={wards} isLoading={wardsLoading} />
    </div>
  );
}
