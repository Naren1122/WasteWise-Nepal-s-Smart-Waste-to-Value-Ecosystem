'use client';

import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/stores/auth.store';
import {
  useApproveBulkyQuote,
  useCompleteBulkyRequest,
  useCancelBulkyRequest,
} from '../hooks/useSchedules';
import { BulkyWasteActionDialog, BulkyActionType } from './BulkyWasteActionDialog';
import { BulkyWasteCard, STATUS_CONFIG } from './BulkyWasteCard';
import type { BulkyWasteRequest } from '../types/schedules.types';

interface BulkyWasteTableProps {
  requests: BulkyWasteRequest[];
  isLoading: boolean;
}

export function BulkyWasteTable({ requests, isLoading }: BulkyWasteTableProps) {
  const { user } = useAuthStore();
  const isOfficer = user && ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER', 'DISPATCHER'].includes(user.role);

  const [activeRequest, setActiveRequest] = useState<BulkyWasteRequest | null>(null);
  const [activeAction, setActiveAction] = useState<BulkyActionType | null>(null);

  const approveMutation = useApproveBulkyQuote();
  const completeMutation = useCompleteBulkyRequest();
  const cancelMutation = useCancelBulkyRequest();

  if (isLoading) {
    return (
      <Card className="p-8 text-center bg-white border border-slate-200 rounded-xl">
        <p className="text-[14px] text-slate-500 animate-pulse">Loading bulky waste requests...</p>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
        <p className="text-base font-semibold text-slate-800">No bulky pickup requests found</p>
        <p className="text-[13px] text-slate-500 mt-1">Book an on-demand collection for furniture, construction debris, or large items.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Mobile & Tablet Stacked Card View */}
      <div className="block md:hidden space-y-3">
        {requests.map((req) => (
          <BulkyWasteCard
            key={req.id}
            request={req}
            isOfficer={isOfficer}
            onApprove={(id) => approveMutation.mutate(id)}
            onCancel={(id) => cancelMutation.mutate(id)}
            onComplete={(id) => completeMutation.mutate(id)}
            onOpenAction={(r, action) => {
              setActiveRequest(r);
              setActiveAction(action);
            }}
          />
        ))}
      </div>

      {/* 2. Desktop High-Density Data Table */}
      <Card className="hidden md:block overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[12px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Citizen / Contact</th>
                <th className="py-3 px-4">Premises Address</th>
                <th className="py-3 px-4">Items / Volume</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4">Quote / Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => {
                const badge = STATUS_CONFIG[req.status];
                const StatusIcon = badge.icon;

                return (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 leading-tight">{req.userName}</div>
                      <div className="text-[12px] text-slate-500 mt-0.5">{req.userPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">Ward {req.wardNumber}</div>
                      <div className="text-[12px] text-slate-500 truncate max-w-[200px]">{req.propertyAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="font-medium text-slate-900 truncate">{req.itemDescription}</div>
                      {req.estimatedVolume && (
                        <div className="text-[11.5px] text-slate-500">{req.estimatedVolume}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[12px]">
                      <div className="text-slate-600">
                        Pref: <span className="font-mono text-slate-800">{new Date(req.preferredDate).toLocaleDateString()}</span>
                      </div>
                      {req.scheduledDate && (
                        <div className="text-emerald-700 font-semibold mt-0.5">
                          Sched: <span className="font-mono">{new Date(req.scheduledDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {req.quotedAmountNpr ? (
                        <span className="font-bold text-slate-900 text-[13px] font-mono">
                          NPR {req.quotedAmountNpr.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[12px] text-slate-400 italic">Pending quote</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'QUOTED' && (
                          <Button
                            size="sm"
                            className="h-8 px-2.5 text-[12px] font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg"
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending}
                          >
                            Approve Quote
                          </Button>
                        )}

                        {isOfficer && req.status === 'SUBMITTED' && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 px-2.5 text-[12px] font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg"
                              onClick={() => {
                                setActiveRequest(req);
                                setActiveAction('QUOTE');
                              }}
                            >
                              Quote Fee
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-[12px] text-rose-600 hover:bg-rose-50 border-rose-200 rounded-lg"
                              onClick={() => {
                                setActiveRequest(req);
                                setActiveAction('REJECT');
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {isOfficer && req.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            className="h-8 px-2.5 text-[12px] font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg"
                            onClick={() => {
                              setActiveRequest(req);
                              setActiveAction('SCHEDULE');
                            }}
                          >
                            Set Date
                          </Button>
                        )}

                        {isOfficer && req.status === 'SCHEDULED' && (
                          <Button
                            size="sm"
                            className="h-8 px-2.5 text-[12px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
                            onClick={() => completeMutation.mutate(req.id)}
                            disabled={completeMutation.isPending}
                          >
                            Mark Done
                          </Button>
                        )}

                        {['SUBMITTED', 'QUOTED'].includes(req.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-[12px] text-slate-500 hover:text-slate-800"
                            onClick={() => cancelMutation.mutate(req.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reusable Action Dialog */}
      <BulkyWasteActionDialog
        request={activeRequest}
        actionType={activeAction}
        onClose={() => {
          setActiveRequest(null);
          setActiveAction(null);
        }}
      />
    </div>
  );
}
