'use client';

import React, { useState } from 'react';
import type { RouteStop, StopStatus } from '../types/routes.types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  ChevronDown,
  Clock,
} from 'lucide-react';

interface DriverStopCardProps {
  stop: RouteStop;
  onUpdateStatus: (
    stopId: string,
    status: StopStatus,
    failureReason?: string,
    notes?: string
  ) => void;
  isProcessing?: boolean;
}

export function DriverStopCard({
  stop,
  onUpdateStatus,
  isProcessing,
}: DriverStopCardProps) {
  const [showIssueInput, setShowIssueInput] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const isCompleted = stop.status === 'COLLECTED';
  const isMissed = stop.status === 'MISSED' || stop.status === 'REJECTED';

  const handleMarkCollected = () => {
    onUpdateStatus(stop.id, 'COLLECTED');
  };

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failureReason.trim()) return;
    onUpdateStatus(stop.id, 'MISSED', failureReason.trim());
    setShowIssueInput(false);
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-emerald-50/40 border-emerald-200'
          : isMissed
          ? 'bg-rose-50/40 border-rose-200'
          : 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
            #{stop.sequenceOrder}
          </span>
          <div>
            <h4 className="text-[15px] font-bold text-slate-900 leading-snug">
              {stop.houseNumber ? `House ${stop.houseNumber}` : 'Premises Point'}
            </h4>
            <p className="text-[12.5px] text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{stop.propertyAddress || 'Address on record'}</span>
            </p>
          </div>
        </div>

        {stop.bulkyRequestId && (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 shrink-0 text-[11px]">
            BULKY PICKUP
          </Badge>
        )}
      </div>

      {/* Completion info or Actions */}
      <div className="mt-3.5 pt-3 border-t border-slate-100">
        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[13px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Waste Collected</span>
            {stop.completedAt && (
              <span className="text-[11.5px] text-slate-400 font-normal ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(stop.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        ) : isMissed ? (
          <div className="flex items-center gap-1.5 text-rose-700 text-[13px] font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Missed: {stop.failureReason || 'Reported Obstruction'}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {!showIssueInput ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleMarkCollected}
                  disabled={isProcessing}
                  className="h-11 sm:h-10 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[14px] rounded-lg shadow-xs"
                >
                  <PackageCheck className="w-4 h-4 mr-2" />
                  Confirm Collection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIssueInput(true)}
                  disabled={isProcessing}
                  className="h-11 sm:h-10 text-[13.5px] border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Issue / Skip
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReportIssue} className="space-y-2 pt-1">
                <Input
                  type="text"
                  placeholder="Reason (e.g. Locked gate, road blocked)..."
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  required
                  autoFocus
                  className="h-10 text-[13.5px]"
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isProcessing || !failureReason.trim()}
                    className="h-9 flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Report Missed Stop
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIssueInput(false)}
                    className="h-9 px-3 text-xs border-slate-300 rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

