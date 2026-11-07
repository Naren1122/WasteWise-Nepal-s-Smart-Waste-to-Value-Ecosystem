'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useRecordCashPayment } from '@/features/payments/api/usePayments';
import type { InvoiceDetailDto } from '../types/billing.types';
import type { PaymentReceiptDto } from '@/features/payments/types/payments.types';
import { Banknote, Loader2, CheckCircle2 } from 'lucide-react';

interface CashCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetailDto | null;
  onSuccess: (receipt: PaymentReceiptDto) => void;
}

export function CashCounterModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: CashCounterModalProps) {
  const [receivedAmount, setReceivedAmount] = useState<number>(invoice?.totalAmount ?? 0);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recordCashMutation = useRecordCashPayment();

  // Reset state when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setReceivedAmount(invoice.totalAmount);
      setNotes('');
      setErrorMessage(null);
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (receivedAmount < invoice.totalAmount) {
      setErrorMessage(`Received cash cannot be less than invoice total (NPR ${invoice.totalAmount.toFixed(2)})`);
      return;
    }

    try {
      const receipt = await recordCashMutation.mutateAsync({
        invoiceId: invoice.id,
        receivedAmount,
        notes: notes.trim() || undefined,
      });

      onClose();
      onSuccess(receipt);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to record over-the-counter cash settlement'
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !recordCashMutation.isPending && !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <DialogTitle className="text-[19px] font-semibold text-slate-900">
              Ward Cash Counter Settlement
            </DialogTitle>
          </div>
          <DialogDescription className="text-[14px] text-slate-500">
            Record physical cash received at ward office counter
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 my-1 text-[13px] space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice Number:</span>
            <span className="font-mono font-medium text-slate-800">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Citizen:</span>
            <span className="font-medium text-slate-800">{invoice.citizenName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Property:</span>
            <span className="text-slate-700 truncate max-w-[200px]">{invoice.propertyAddress}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span className="font-semibold text-slate-800">Total Billed:</span>
            <span className="font-bold text-emerald-700">
              NPR {invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSettle} className="space-y-4 pt-1">
          <div>
            <label className="text-[14px] font-medium text-slate-700 block mb-1">
              Cash Amount Received (NPR)
            </label>
            <Input
              type="number"
              step="0.01"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
              required
              className="h-10 text-[15px]"
            />
            {receivedAmount > invoice.totalAmount && (
              <span className="text-[12px] text-amber-600 block mt-1">
                Change to return: NPR {(receivedAmount - invoice.totalAmount).toFixed(2)}
              </span>
            )}
          </div>

          <div>
            <label className="text-[14px] font-medium text-slate-700 block mb-1">
              Counter Notes (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Token #42, paid by tenant brother"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-[15px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={recordCashMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recordCashMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {recordCashMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Settlement...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm &amp; Issue Receipt
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

