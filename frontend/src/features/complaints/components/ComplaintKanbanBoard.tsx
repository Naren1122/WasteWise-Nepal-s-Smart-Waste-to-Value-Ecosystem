'use client';

import React, { useOptimistic, useTransition } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useTriageComplaint } from '../api/useComplaints';
import { STATUS_BADGE_CONFIG, CATEGORY_LABELS } from '../types/complaints.types';
import type { ComplaintSummaryDto, ComplaintStatus } from '../types/complaints.types';
import { AlertTriangle, Clock, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ComplaintKanbanBoardProps {
  complaints: ComplaintSummaryDto[];
  onSelectComplaint: (id: string) => void;
  canTriage?: boolean;
}

const KANBAN_COLUMNS: Array<{ status: ComplaintStatus; label: string; headerClass: string }> = [
  { status: 'SUBMITTED', label: 'New / Lodged', headerClass: 'border-t-4 border-slate-400 bg-slate-50' },
  { status: 'UNDER_REVIEW', label: 'Under Review', headerClass: 'border-t-4 border-blue-500 bg-blue-50/40' },
  { status: 'ASSIGNED', label: 'Assigned / In Progress', headerClass: 'border-t-4 border-amber-500 bg-amber-50/40' },
  { status: 'RESOLVED', label: 'Resolved', headerClass: 'border-t-4 border-emerald-500 bg-emerald-50/40' },
];

export function ComplaintKanbanBoard({
  complaints,
  onSelectComplaint,
  canTriage = true,
}: ComplaintKanbanBoardProps) {
  const triageMutation = useTriageComplaint();
  const [, startTransition] = useTransition();

  const [optimisticComplaints, setOptimisticStatus] = useOptimistic(
    complaints,
    (state, { id, nextStatus }: { id: string; nextStatus: ComplaintStatus }) =>
      state.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
  );

  const handleQuickAdvance = (e: React.MouseEvent, complaint: ComplaintSummaryDto) => {
    e.stopPropagation();
    if (!canTriage) return;
    let nextStatus: ComplaintStatus | null = null;
    if (complaint.status === 'SUBMITTED') nextStatus = 'UNDER_REVIEW';
    else if (complaint.status === 'UNDER_REVIEW') nextStatus = 'ASSIGNED';
    if (!nextStatus) return;

    startTransition(async () => {
      setOptimisticStatus({ id: complaint.id, nextStatus });
      try {
        await triageMutation.mutateAsync({ id: complaint.id, payload: { status: nextStatus } });
      } catch {
        // rollback handled by React 19 optimistic state automatically
      }
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Critical</Badge>;
      case 'HIGH': return <Badge className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case 'MEDIUM': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Medium</Badge>;
      default: return <Badge className="bg-slate-50 text-slate-700 border-slate-200">Low</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {KANBAN_COLUMNS.map((col) => {
        const columnItems = optimisticComplaints.filter((item) =>
          col.status === 'ASSIGNED' ? item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS' : item.status === col.status
        );

        return (
          <div key={col.status} className="flex flex-col bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 min-h-[500px]">
            <div className={`p-2.5 rounded-lg mb-3 flex items-center justify-between shadow-xs ${col.headerClass}`}>
              <span className="font-semibold text-slate-800 text-[15px]">{col.label}</span>
              <span className="bg-white text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold border border-slate-200">
                {columnItems.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {columnItems.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No complaints
                </div>
              ) : (
                columnItems.map((item) => (
                  <Card
                    key={item.id}
                    onClick={() => onSelectComplaint(item.id)}
                    className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer transition-all duration-150 rounded-lg"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        #{item.ticketNumber}
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>

                    <h4 className="font-semibold text-slate-900 text-[14px] line-clamp-2 leading-snug mb-1 break-words">
                      {item.title}
                    </h4>

                    <div className="text-xs text-slate-500 mb-2.5 flex items-center gap-1">
                      <span>{CATEGORY_LABELS[item.category]}</span>
                      {item.wardNumber ? <span>• Ward {item.wardNumber}</span> : null}
                    </div>

                    {item.isSlaBreached && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-medium mb-2.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>SLA Breached</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>

                      {canTriage && (item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleQuickAdvance(e, item)}
                          className="h-6 px-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          Advance <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

