'use client';

import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { CollectionSchedule, WasteType } from '../types/schedules.types';
import { ScheduleSummaryFooter } from './ScheduleSummaryFooter';
import { CreateScheduleRuleDialog } from './CreateScheduleRuleDialog';
import { GenerateManifestDialog } from './GenerateManifestDialog';
import { Calendar, Clock, Recycle, Sparkles, AlertTriangle, Package, Truck, Plus, FileSpreadsheet } from 'lucide-react';

const DAYS_OF_WEEK = [
  { name: 'Sunday', sub: 'Weekend Op Run' },
  { name: 'Monday', sub: 'High Volume' },
  { name: 'Tuesday', sub: 'Midweek Stream' },
  { name: 'Wednesday', sub: 'Active Sweep' },
  { name: 'Thursday', sub: 'Standard Run' },
  { name: 'Friday', sub: 'Grid Wide Sweep' },
  { name: 'Saturday', sub: 'Community Drop' },
];

const WASTE_TYPE_CONFIG: Record<
  WasteType,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ORGANIC: {
    label: 'Organic',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: Sparkles,
  },
  RECYCLABLE: {
    label: 'Dry Recyclables',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: Recycle,
  },
  HAZARDOUS: {
    label: 'Hazardous',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: AlertTriangle,
  },
  BULKY: {
    label: 'Bulky',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Package,
  },
};

interface ScheduleTimetableProps {
  schedules: CollectionSchedule[];
  isLoading: boolean;
  selectedWardNumber?: number | null;
  selectedWardId?: string;
}

export function ScheduleTimetable({
  schedules,
  isLoading,
  selectedWardNumber,
  selectedWardId,
}: ScheduleTimetableProps) {
  const { user } = useAuthStore();
  const isStaff = user && ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER', 'DISPATCHER'].includes(user.role);

  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [manifestOpen, setManifestOpen] = useState(false);
  const currentDayOfWeek = new Date().getDay();

  if (isLoading) {
    return (
      <Card className="p-8 text-center bg-white border border-slate-200 rounded-xl">
        <p className="text-[14px] text-slate-500 animate-pulse">Loading collection timetable...</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-5">
        {/* 1. Timetable Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-[18px] font-bold text-slate-900 tracking-tight">
              Weekly Ward Collection Timetable
            </h2>
            <p className="text-[12.5px] sm:text-[13px] text-slate-500 mt-0.5">
              Standard recurring municipal waste pickup windows by operational sector and waste stream
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {isStaff && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManifestOpen(true)}
                  className="h-8 px-2.5 text-[12px] font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Generate Manifest</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddRuleOpen(true)}
                  className="h-8 px-2.5 text-[12px] font-bold rounded-lg border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </Button>
              </>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>7-Day Cycle</span>
            </div>
          </div>
        </div>

        {/* 2. 7-Column Timetable Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-start">
          {DAYS_OF_WEEK.map((day, dayIndex) => {
            const isToday = dayIndex === currentDayOfWeek;
            const daySchedules = schedules.filter((s) => s.dayOfWeek === dayIndex && s.isActive);

            return (
              <div
                key={day.name}
                className={`p-3 rounded-xl border flex flex-col justify-between min-h-[150px] transition-all ${
                  isToday
                    ? 'border-emerald-600 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-600/30'
                    : 'border-slate-200/70 bg-slate-50/50 hover:bg-slate-50/80'
                }`}
              >
                <div className={`flex items-center justify-between pb-2 border-b ${isToday ? 'border-emerald-200' : 'border-slate-200/60'}`}>
                  <div className="flex flex-col">
                    <span className={`font-bold text-[13.5px] uppercase tracking-wide ${isToday ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {day.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      {day.sub}
                    </span>
                  </div>
                  {isToday && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-800 text-white tracking-wider">
                      Today
                    </span>
                  )}
                </div>

                <div className="flex-1 py-2.5 space-y-2">
                  {daySchedules.length === 0 ? (
                    <span className="text-[12px] text-slate-400 italic block pt-3">No regular collection</span>
                  ) : (
                    daySchedules.map((schedule, idx) => {
                      const config = WASTE_TYPE_CONFIG[schedule.wasteType] || WASTE_TYPE_CONFIG.ORGANIC;
                      const Icon = config.icon;

                      return (
                        <article
                          key={schedule.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1.5 transition-transform hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${config.className}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{config.label}</span>
                            </span>
                            {!selectedWardNumber && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-mono border border-slate-200">
                                W{schedule.wardNumber}
                              </span>
                            )}
                          </div>

                          <div className="text-[12.5px] font-bold text-slate-900 font-mono tracking-tight pt-0.5">
                            {schedule.startTime} – {schedule.endTime}
                          </div>

                          <div className="text-[10.5px] text-slate-500 flex items-center gap-1 truncate pt-0.5 border-t border-slate-100">
                            <Truck className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {schedule.zoneName || `R-0${schedule.wardNumber} • Compactor ${idx + 1}`}
                            </span>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Category Summary Legend / Metric Strip */}
        <ScheduleSummaryFooter schedules={schedules} />
      </Card>

      {/* Staff Rule Creation Modal */}
      <CreateScheduleRuleDialog
        open={addRuleOpen}
        onOpenChange={setAddRuleOpen}
        defaultWardId={selectedWardId}
      />

      {/* Dispatcher Daily Manifest Modal */}
      <GenerateManifestDialog
        open={manifestOpen}
        onOpenChange={setManifestOpen}
      />
    </>
  );
}
