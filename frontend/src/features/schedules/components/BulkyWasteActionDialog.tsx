'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  useQuoteBulkyRequest,
  useScheduleBulkyPickup,
  useRejectBulkyRequest,
} from '../hooks/useSchedules';
import type { BulkyWasteRequest } from '../types/schedules.types';
import { ApiClientError } from '@/shared/lib/api-client';
import { DollarSign, Calendar, AlertTriangle, AlertCircle } from 'lucide-react';

export type BulkyActionType = 'QUOTE' | 'SCHEDULE' | 'REJECT';

interface BulkyWasteActionDialogProps {
  request: BulkyWasteRequest | null;
  actionType: BulkyActionType | null;
  onClose: () => void;
}

export function BulkyWasteActionDialog({
  request,
  actionType,
  onClose,
}: BulkyWasteActionDialogProps) {
  const [quoteNpr, setQuoteNpr] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quoteMutation = useQuoteBulkyRequest();
  const scheduleMutation = useScheduleBulkyPickup();
  const rejectMutation = useRejectBulkyRequest();

  if (!request || !actionType) return null;

  const isSubmitting =
    quoteMutation.isPending || scheduleMutation.isPending || rejectMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (actionType === 'QUOTE') {
        const amount = Number(quoteNpr);
        if (!amount || amount <= 0) {
          setErrorMsg('Please enter a valid NPR quote amount.');
          return;
        }
        await quoteMutation.mutateAsync({
          requestId: request.id,
          data: { quotedAmountNpr: amount, officerNotes: notes.trim() || null },
        });
      } else if (actionType === 'SCHEDULE') {
        if (!scheduledDate) {
          setErrorMsg('Please select a collection date.');
          return;
        }
        await scheduleMutation.mutateAsync({
          requestId: request.id,
          data: { scheduledDate, officerNotes: notes.trim() || null },
        });
      } else if (actionType === 'REJECT') {
        if (!reason.trim()) {
          setErrorMsg('Please provide a reason for rejecting this request.');
          return;
        }
        await rejectMutation.mutateAsync({
          requestId: request.id,
          data: {
            officerNotes: reason.trim(),
            reason: reason.trim(),
          },
        });
      }

      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (typeof err.details === 'object' && err.details !== null) {
          const detailMsgs = Object.values(err.details).flat().join(', ');
          if (detailMsgs) {
            setErrorMsg(detailMsgs);
            return;
          }
        }
        setErrorMsg(err.message);
        return;
      }
      const msg = err instanceof Error ? err.message : 'Action failed';
      setErrorMsg(msg);
    }
  };

  const getDetails = () => {
    switch (actionType) {
      case 'QUOTE':
        return {
          title: 'Provide Fee Quotation',
          desc: `Set the official municipal collection fee in NPR for Ward ${request.wardNumber}.`,
          icon: DollarSign,
          submitLabel: 'Submit Quote',
          btnColor: 'bg-emerald-900 hover:bg-emerald-950',
        };
      case 'SCHEDULE':
        return {
          title: 'Schedule Pickup Date',
          desc: `Confirm pickup date for ${request.propertyAddress}.`,
          icon: Calendar,
          submitLabel: 'Confirm Schedule',
          btnColor: 'bg-blue-800 hover:bg-blue-900',
        };
      case 'REJECT':
      default:
        return {
          title: 'Reject Bulky Request',
          desc: `Provide clarification why this bulky waste cannot be collected.`,
          icon: AlertTriangle,
          submitLabel: 'Reject Request',
          btnColor: 'bg-rose-700 hover:bg-rose-800',
        };
    }
  };

  const config = getDetails();
  const Icon = config.icon;

  return (
    <Dialog open={!!actionType} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-6 bg-white rounded-2xl border border-slate-200">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {config.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            {config.desc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {actionType === 'QUOTE' && (
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-800">
                Quoted Amount (NPR) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 1500"
                value={quoteNpr}
                onChange={(e) => setQuoteNpr(e.target.value)}
                className="h-10 text-[13.5px] border-slate-200 rounded-lg"
              />
            </div>
          )}

          {actionType === 'SCHEDULE' && (
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-800">
                Scheduled Collection Date *
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-10 text-[13.5px] border-slate-200 rounded-lg"
              />
            </div>
          )}

          {actionType === 'REJECT' ? (
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-800">
                Reason for Rejection *
              </label>
              <Textarea
                placeholder="Explain why the pickup is rejected (e.g., Hazardous chemicals not permitted)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-20 text-[13px] border-slate-200 rounded-lg resize-none"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-800">
                Officer Notes (Optional)
              </label>
              <Input
                placeholder="Access instructions or team notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 text-[13px] border-slate-200 rounded-lg"
              />
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-[13px] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className={`h-9 text-[13px] font-bold text-white rounded-lg ${config.btnColor}`}
            >
              {config.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

