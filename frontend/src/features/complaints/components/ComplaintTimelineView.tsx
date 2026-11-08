'use client';

import React from 'react';
import { History, Shield, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import type { ComplaintTimelineDto } from '../types/complaints.types';

interface ComplaintTimelineViewProps {
  timelines: ComplaintTimelineDto[];
}

function getActionIcon(action: string) {
  switch (action) {
    case 'LODGED':
      return <AlertCircle className="h-3.5 w-3.5 text-blue-600" />;
    case 'TRIAGED':
    case 'ASSIGNED':
      return <Shield className="h-3.5 w-3.5 text-purple-600" />;
    case 'RESOLVED':
    case 'CLOSED':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
    default:
      return <MessageSquare className="h-3.5 w-3.5 text-slate-500" />;
  }
}

export function ComplaintTimelineView({ timelines }: ComplaintTimelineViewProps) {
  if (!timelines || timelines.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs text-center text-xs text-slate-400">
        No audit activity recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-slate-400" /> Audit Trail & History
        </span>
        <span className="text-[11px] text-slate-400 font-medium">
          {timelines.length} event{timelines.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-2.5 space-y-4 pl-4 pt-1">
        {timelines.map((tl) => (
          <div key={tl.id} className="relative group">
            {/* Timeline Node Dot */}
            <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
              {getActionIcon(tl.action)}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-slate-800 capitalize">
                  {tl.action.toLowerCase().replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(tl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {tl.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 mt-1 border border-slate-100">
                  {tl.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

