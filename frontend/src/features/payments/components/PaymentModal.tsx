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
import { useInitiatePayment } from '../api/usePayments';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    propertyAddress: string;
    totalAmount: number;
    billingMonth: number;
    billingYear: number;
  } | null;
}

export function PaymentModal({ isOpen, onClose, invoice }: PaymentModalProps) {
  const [gateway, setGateway] = useState<'ESEWA' | 'KHALTI'>('ESEWA');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initiatePayment = useInitiatePayment();

  if (!invoice) return null;

  const handleCheckout = async () => {
    try {
      setErrorMessage(null);
      setIsRedirecting(true);

      const result = await initiatePayment.mutateAsync({
        invoiceId: invoice.id,
        gateway,
      });

      if (gateway === 'ESEWA' && result.formData && result.paymentUrl) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.paymentUrl;
        Object.entries(result.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else if (gateway === 'KHALTI' && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('Unable to generate payment checkout redirect URL');
      }
    } catch (err) {
      setIsRedirecting(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Payment initiation failed. Please try again.'
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isRedirecting && !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold text-slate-900">
            Digital Payment Checkout
          </DialogTitle>
          <DialogDescription className="text-[14px] text-slate-500">
            Secure municipal payment gateway integration
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Brief */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 my-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13px] font-medium text-slate-500">Invoice Number</span>
            <span className="text-[14px] font-semibold text-slate-800">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13px] font-medium text-slate-500">Billing Period</span>
            <span className="text-[14px] text-slate-700">
              {invoice.billingMonth}/{invoice.billingYear}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-medium text-slate-500">Property</span>
            <span className="text-[13px] text-slate-700 truncate max-w-[200px]">
              {invoice.propertyAddress}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
            <span className="text-[14px] font-semibold text-slate-800">Total Payable</span>
            <span className="text-[22px] font-bold text-emerald-600">
              NPR {invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Gateway Selection */}
        <div className="space-y-3">
          <label className="text-[14px] font-medium text-slate-700 block">
            Select Payment Method:
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* eSewa Option */}
            <button
              type="button"
              onClick={() => setGateway('ESEWA')}
              disabled={isRedirecting}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                gateway === 'ESEWA'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block" />
                <span className="font-bold text-[15px] text-slate-900">eSewa</span>
              </div>
              <p className="text-[12px] text-slate-500">ePay v2 Instant Wallet</p>
            </button>

            {/* Khalti Option */}
            <button
              type="button"
              onClick={() => setGateway('KHALTI')}
              disabled={isRedirecting}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                gateway === 'KHALTI'
                  ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 inline-block" />
                <span className="font-bold text-[15px] text-slate-900">Khalti</span>
              </div>
              <p className="text-[12px] text-slate-500">Wallet & Net Banking</p>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
            {errorMessage}
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <Button
            onClick={handleCheckout}
            disabled={isRedirecting || initiatePayment.isPending}
            className="w-full h-11 text-[15px] font-semibold bg-emerald-600 hover:bg-emerald-700"
          >
            {isRedirecting || initiatePayment.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to {gateway === 'ESEWA' ? 'eSewa' : 'Khalti'}...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Pay with {gateway === 'ESEWA' ? 'eSewa' : 'Khalti'}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[12px] text-slate-400 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit encrypted municipal verification</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

