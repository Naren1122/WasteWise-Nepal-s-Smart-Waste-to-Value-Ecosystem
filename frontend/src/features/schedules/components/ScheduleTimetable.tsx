'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import type { CollectionSchedule, WasteType } from '../types/schedules.types';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WASTE_TYPE_STYLES: Record<WasteType, { label: string; className: string }> = {
  ORGANIC: {
    label: 'Organic',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  RECYCLABLE: {
    label: 'Recyclable',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  HAZARDOUS: {
    label: 'Hazardous',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  BULKY: {
    label: 'Bulky',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

interface ScheduleTimetableProps {
  schedules: CollectionSchedule[];
  isLoading: boolean;
}

export function ScheduleTimetable({ schedules, isLoading }: ScheduleTimetableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-40 flex items-center justify-center text-slate-400 text-[15px]">
          Loading collection timetable...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[17px] font-semibold text-slate-900">Weekly Pickup Timetable</h3>
          <p className="text-[14px] text-slate-500">Standard recurring municipal waste collection days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((dayName, dayIndex) => {
          const daySchedules = schedules.filter((s) => s.dayOfWeek === dayIndex && s.isActive);

          return (
            <div
              key={dayName}
              className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between min-h-[120px]"
            >
              <div className="font-semibold text-[14px] text-slate-800 pb-2 border-b border-slate-200/60">
                {dayName}
              </div>

              <div className="flex-1 py-2 space-y-1.5">
                {daySchedules.length === 0 ? (
                  <span className="text-[13px] text-slate-400 italic">No pickup</span>
                ) : (
                  daySchedules.map((schedule) => {
                    const style = WASTE_TYPE_STYLES[schedule.wasteType];
                    return (
                      <div key={schedule.id} className="space-y-1">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${style.className}`}
                        >
                          {style.label}
                        </span>
                        <div className="text-[12px] text-slate-500 font-mono">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
