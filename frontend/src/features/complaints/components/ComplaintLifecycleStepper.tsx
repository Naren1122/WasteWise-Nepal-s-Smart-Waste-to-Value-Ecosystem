'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { ComplaintStatus } from '../types/complaints.types';

interface ComplaintLifecycleStepperProps {
  status: ComplaintStatus;
}

const LIFECYCLE_STEPS: Array<{ key: ComplaintStatus; label: string; description: string }> = [
  { key: 'SUBMITTED', label: 'Lodged', description: 'Grievance recorded' },
  { key: 'UNDER_REVIEW', label: 'Review', description: 'Ward verification' },
  { key: 'ASSIGNED', label: 'Dispatched', description: 'Field crew assigned' },
  { key: 'RESOLVED', label: 'Resolved', description: 'Cleared on-site' },
];

function getStepIndex(status: ComplaintStatus): number {
  switch (status) {
    case 'SUBMITTED': return 0;
    case 'UNDER_REVIEW': return 1;
    case 'ASSIGNED':
    case 'IN_PROGRESS': return 2;
    case 'RESOLVED':
    case 'CLOSED': return 3;
    case 'REJECTED': return -1;
    default: return 0;
  }
}

export function ComplaintLifecycleStepper({ status }: ComplaintLifecycleStepperProps) {
  if (status === 'REJECTED') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 font-medium flex items-center justify-between">
        <span>Grievance Status: Rejected by Ward Officer</span>
        <span className="font-semibold uppercase tracking-wider text-[11px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded">Closed</span>
      </div>
    );
  }

  const currentIdx = getStepIndex(status);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Resolution Pipeline
        </span>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Step {Math.min(currentIdx + 1, 4)} of 4
        </span>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Background Connecting Bar */}
        <div className="absolute left-6 right-6 top-3.5 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
        <div
          className="absolute left-6 top-3.5 -translate-y-1/2 h-0.5 bg-emerald-600 z-0 transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, (currentIdx / 3) * 100))}%` }}
        />

        {LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-white text-emerald-700 border-2 border-emerald-600 ring-4 ring-emerald-100 font-extrabold'
                    : 'bg-white text-slate-400 border border-slate-300'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium ${
                  isCurrent ? 'font-bold text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

