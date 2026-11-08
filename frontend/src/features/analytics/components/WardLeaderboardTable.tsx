'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Award, CheckCircle2 } from 'lucide-react';
import type { WardPerformanceCardDto } from '../types/analytics.types';

interface WardLeaderboardTableProps {
  wards?: WardPerformanceCardDto[] | undefined;
  isLoading: boolean;
}

export function WardLeaderboardTable({ wards, isLoading }: WardLeaderboardTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Ward Performance Leaderboard
        </h2>
        <span className="text-[13px] text-slate-500">
          {wards?.length ?? 0} Municipal Wards
        </span>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[13px]">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Stops Scheduled</th>
                <th className="py-3 px-4">Collected</th>
                <th className="py-3 px-4">Efficiency</th>
                <th className="py-3 px-4">Open Tickets</th>
                <th className="py-3 px-4">SLA Breach Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading ward scorecards...
                  </td>
                </tr>
              ) : !wards || wards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No ward operational records found for this period.
                  </td>
                </tr>
              ) : (
                wards.map((w) => (
                  <tr key={w.wardId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      #{w.rank}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      Ward {w.wardNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {w.scheduledStops.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {w.collectedStops.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        w.collectionEfficiencyPct >= 90
                          ? 'text-emerald-700'
                          : w.collectionEfficiencyPct >= 75
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}>
                        {w.collectionEfficiencyPct >= 90 && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {w.collectionEfficiencyPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {w.openGrievances}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {w.slaBreachRatePct}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

