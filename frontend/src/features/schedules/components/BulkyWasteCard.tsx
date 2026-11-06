'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import type { BulkyWasteRequest, BulkyWasteStatus } from '../types/schedules.types';
import { BulkyActionType } from './BulkyWasteActionDialog';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Check,
  XCircle,
  MapPin,
  Package,
} from 'lucide-react';

export const STATUS_CONFIG: Record<
  BulkyWasteStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SUBMITTED: { label: 'Submitted', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
  QUOTED: { label: 'Quoted', className: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: AlertCircle },
  APPROVED: { label: 'Approved', className: 'bg-sky-50 text-sky-800 border-sky-200', icon: CheckCircle2 },
  SCHEDULED: { label: 'Scheduled', className: 'bg-blue-50 text-blue-800 border-blue-200', icon: Calendar },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Check },
  REJECTED: { label: 'Rejected', className: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

interface BulkyWasteCardProps {
  request: BulkyWasteRequest;
  isOfficer: boolean | null;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenAction: (req: BulkyWasteRequest, action: BulkyActionType) => void;
}

export function BulkyWasteCard({
  request,
  isOfficer,
  onApprove,
  onCancel,
  onComplete,
  onOpenAction,
}: BulkyWasteCardProps) {
  const badge = STATUS_CONFIG[request.status];
  const StatusIcon = badge.icon;

  return (
    <Card className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-3">
      {/* Top Header: Citizen & Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-[15px] text-slate-900 leading-tight">
            {request.userName}
          </h4>
          <p className="text-[12px] text-slate-500 mt-0.5">{request.userPhone}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${badge.className}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Premises Address */}
      <div className="flex items-start gap-1.5 text-[12.5px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <span className="font-semibold text-slate-800">Ward {request.wardNumber}: </span>
          <span className="text-slate-600">{request.propertyAddress}</span>
        </div>
      </div>

      {/* Items Description */}
      <div className="space-y-1">
        <div className="flex items-start gap-1.5 text-[13px] text-slate-900">
          <Package className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span className="font-medium">{request.itemDescription}</span>
        </div>
        {request.estimatedVolume && (
          <span className="inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-5">
            {request.estimatedVolume}
          </span>
        )}
      </div>

      {/* Dates & Fee Row */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
        <div>
          <span className="text-slate-500">Preferred: </span>
          <span className="font-mono font-semibold text-slate-800">
            {new Date(request.preferredDate).toLocaleDateString()}
          </span>
          {request.scheduledDate && (
            <div className="text-emerald-700 font-semibold mt-0.5">
              Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block uppercase">Fee</span>
          {request.quotedAmountNpr ? (
            <span className="font-mono font-bold text-[14px] text-slate-900">
              NPR {request.quotedAmountNpr.toLocaleString()}
            </span>
          ) : (
            <span className="text-[11.5px] text-slate-400 italic">Pending</span>
          )}
        </div>
      </div>

      {/* Action Buttons for Mobile */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
        {request.status === 'QUOTED' && (
          <Button
            size="sm"
            className="flex-1 h-10 text-[13px] font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg"
            onClick={() => onApprove(request.id)}
          >
            Approve Quote
          </Button>
        )}

        {isOfficer && request.status === 'SUBMITTED' && (
          <>
            <Button
              size="sm"
              className="flex-1 h-10 text-[13px] font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg"
              onClick={() => onOpenAction(request, 'QUOTE')}
            >
              Quote Fee
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 text-[13px] text-rose-600 hover:bg-rose-50 border-rose-200 rounded-lg"
              onClick={() => onOpenAction(request, 'REJECT')}
            >
              Reject
            </Button>
          </>
        )}

        {isOfficer && request.status === 'APPROVED' && (
          <Button
            size="sm"
            className="flex-1 h-10 text-[13px] font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg"
            onClick={() => onOpenAction(request, 'SCHEDULE')}
          >
            Set Pickup Date
          </Button>
        )}

        {isOfficer && request.status === 'SCHEDULED' && (
          <Button
            size="sm"
            className="flex-1 h-10 text-[13px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
            onClick={() => onComplete(request.id)}
          >
            Mark Done
          </Button>
        )}

        {['SUBMITTED', 'QUOTED'].includes(request.status) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-3 text-[12.5px] text-slate-500 hover:text-slate-800"
            onClick={() => onCancel(request.id)}
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

