'use client';

import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import {
  useScheduleBulkyPickup,
} from '../hooks/useSchedules';
import type { BulkyWasteRequest, BulkyWasteStatus } from '../types/schedules.types';

const STATUS_BADGES: Record<BulkyWasteStatus, { label: string; className: string }> = {
  REQUESTED: { label: 'Requested', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  COLLECTED: { label: 'Collected', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

interface BulkyWasteTableProps {
  requests: BulkyWasteRequest[];
  isLoading: boolean;
}

export function BulkyWasteTable({ requests, isLoading }: BulkyWasteTableProps) {
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [quotedAmount, setQuotedAmount] = useState<string>('');

  const scheduleMutation = useScheduleBulkyPickup();

  const handleConfirmSchedule = async (requestId: string) => {
    if (!scheduledDate) return;
    await scheduleMutation.mutateAsync({
      requestId,
      scheduledDate,
      quotedAmountNpr: quotedAmount ? Number(quotedAmount) : undefined,
    });
    setActiveRequestId(null);
    setScheduledDate('');
    setQuotedAmount('');
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-32 flex items-center justify-center text-slate-400 text-[15px]">
          Loading bulky waste requests...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[17px] font-semibold text-slate-900">Bulky Waste On-Demand Queue</h3>
          <p className="text-[14px] text-slate-500">Citizen requests for large items and construction debris pickup</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-[14px]">
          No bulky waste requests currently pending.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold text-[13px]">
              <tr>
                <th className="py-3 px-4">Citizen</th>
                <th className="py-3 px-4">Ward / Address</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4">Preferred Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => {
                const badge = STATUS_BADGES[req.status];
                const isScheduling = activeRequestId === req.id;

                return (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{req.userName}</div>
                      <div className="text-[12px] text-slate-500">{req.userPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">Ward {req.wardNumber}</span>
                      <div className="text-[12px] text-slate-500 truncate max-w-[200px]">{req.propertyAddress}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {req.itemDescription}
                      {req.estimatedVolume && (
                        <div className="text-[12px] text-slate-500">{req.estimatedVolume}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[13px]">
                      {new Date(req.preferredDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'REQUESTED' && !isScheduling && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveRequestId(req.id);
                            setScheduledDate(new Date(req.preferredDate).toISOString().split('T')[0] ?? '');
                          }}
                        >
                          Schedule
                        </Button>
                      )}
                      {isScheduling && (
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-36 h-8 text-[12px]"
                          />
                          <Input
                            type="number"
                            placeholder="NPR Fee"
                            value={quotedAmount}
                            onChange={(e) => setQuotedAmount(e.target.value)}
                            className="w-24 h-8 text-[12px]"
                          />
                          <Button
                            size="sm"
                            className="h-8 text-[12px]"
                            disabled={scheduleMutation.isPending || !scheduledDate}
                            onClick={() => handleConfirmSchedule(req.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[12px]"
                            onClick={() => setActiveRequestId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {req.status !== 'REQUESTED' && (
                        <span className="text-[13px] text-slate-400 font-mono">
                          {req.quotedAmountNpr ? `NPR ${req.quotedAmountNpr}` : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
