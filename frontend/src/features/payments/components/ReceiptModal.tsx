'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import type { PaymentReceiptDto } from '../types/payments.types';
import { Printer, CheckCircle, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceiptDto | null;
}

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.paidAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-8">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <DialogTitle className="text-[20px] font-bold text-slate-900">
            Official Municipal Tax & Waste Receipt
          </DialogTitle>
          <p className="text-[13px] text-slate-500">
            Digital Revenue Collection Voucher &bull; Government of Nepal
          </p>
        </DialogHeader>

        {/* Printable Voucher Box */}
        <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50/60 my-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Receipt Number
              </span>
              <span className="text-[15px] font-mono font-bold text-slate-800">
                {receipt.receiptNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Date & Time
              </span>
              <span className="text-[13px] text-slate-600">{formattedDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Citizen Name
              </span>
              <span className="font-semibold text-slate-800">{receipt.payerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Phone Number
              </span>
              <span className="text-slate-700">{receipt.payerPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Invoice Reference
              </span>
              <span className="font-mono text-slate-700">{receipt.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                Payment Channel
              </span>
              <span className="font-medium text-slate-800">
                {receipt.gateway === 'CASH_COUNTER'
                  ? 'Ward Office Cash Counter'
                  : receipt.gateway === 'ESEWA'
                  ? 'eSewa ePay v2'
                  : 'Khalti Digital Wallet'}
              </span>
            </div>
          </div>

          {receipt.collectedByName && (
            <div className="text-[12px] bg-slate-100 p-2.5 rounded-lg text-slate-600">
              <span className="font-semibold text-slate-800">Ward Cashier: </span>
              {receipt.collectedByName}
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
            <div>
              <span className="text-[12px] text-slate-500 block">Total Amount Settled</span>
              <span className="text-[22px] font-bold text-emerald-600">
                {receipt.currency}{' '}
                {receipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>PAID &amp; SETTLED</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="h-10 px-4">
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

