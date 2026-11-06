'use client';

import React from 'react';
import type { CollectionSchedule } from '../types/schedules.types';
import { ShieldCheck } from 'lucide-react';

interface ScheduleSummaryFooterProps {
  schedules: CollectionSchedule[];
}

export function ScheduleSummaryFooter({ schedules }: ScheduleSummaryFooterProps) {
  const organicCount = schedules.filter((s) => s.wasteType === 'ORGANIC').length;
  const recyclableCount = schedules.filter((s) => s.wasteType === 'RECYCLABLE').length;
  const hazardousCount = schedules.filter((s) => s.wasteType === 'HAZARDOUS').length;
  const bulkyCount = schedules.filter((s) => s.wasteType === 'BULKY').length;

  return (
    <div className="pt-4 border-t border-slate-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/90 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full lg:w-auto">
        {/* Organic Metric */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
          <div className="flex flex-col text-[11.5px] leading-tight">
            <span className="font-bold uppercase tracking-wider text-slate-800">Organic Waste</span>
            <span className="text-slate-500 font-mono text-[11px] mt-0.5">
              {organicCount} Runs/wk • Avg 06:30
            </span>
          </div>
        </div>

        {/* Recyclables Metric */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
          <div className="flex flex-col text-[11.5px] leading-tight">
            <span className="font-bold uppercase tracking-wider text-slate-800">Dry Recyclables</span>
            <span className="text-slate-500 font-mono text-[11px] mt-0.5">
              {recyclableCount} Runs/wk • Avg 07:00
            </span>
          </div>
        </div>

        {/* Hazardous Metric */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <div className="flex flex-col text-[11.5px] leading-tight">
            <span className="font-bold uppercase tracking-wider text-slate-800">Hazardous Waste</span>
            <span className="text-slate-500 font-mono text-[11px] mt-0.5">
              {hazardousCount} Runs/wk • Bio Protocol
            </span>
          </div>
        </div>

        {/* Bulky Metric */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div className="flex flex-col text-[11.5px] leading-tight">
            <span className="font-bold uppercase tracking-wider text-slate-800">Bulky Materials</span>
            <span className="text-slate-500 font-mono text-[11px] mt-0.5">
              {bulkyCount || 1} Runs/wk • On-Demand
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11.5px] uppercase tracking-wider shrink-0 lg:ml-4">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="truncate">Kathmandu Metropolitan City (KMC) • Ward Municipal Division</span>
      </div>
    </div>
  );
}

