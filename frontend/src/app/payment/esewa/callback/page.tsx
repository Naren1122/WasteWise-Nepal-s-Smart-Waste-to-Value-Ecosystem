'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifyEsewaPayment } from '@/features/payments/api/usePayments';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

function EsewaCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verifyMutation = useVerifyEsewaPayment();

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [txDetails, setTxDetails] = useState<{
    txRef: string;
    amount: number;
  } | null>(null);

  const hasInitiatedRef = useRef(false);

  useEffect(() => {
    if (hasInitiatedRef.current) return;
    hasInitiatedRef.current = true;

    const data = searchParams.get('data');
    if (!data) {
      setStatus('failed');
      setErrorMessage('Missing payment data response from eSewa gateway.');
      return;
    }

    verifyMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setStatus('success');
          setTxDetails({
            txRef:
              res.transactionReference ||
              (res as unknown as { receiptNumber?: string }).receiptNumber ||
              'N/A',
            amount:
              res.paidAmount || (res as unknown as { amount?: number }).amount || 0,
          });
        },
        onError: (err) => {
          setStatus('failed');
          setErrorMessage(
            err instanceof Error ? err.message : 'Server error during payment verification.'
          );
        },
      }
    );
  }, [searchParams, verifyMutation]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <div className="py-6 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
            <h1 className="text-[20px] font-bold text-slate-900 mb-1">
              Verifying Payment with eSewa
            </h1>
            <p className="text-[14px] text-slate-500">
              Please wait while we validate your transaction HMAC signature with Nepal eSewa...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-1">
              Payment Successful!
            </h1>
            <p className="text-[14px] text-slate-500 mb-6">
              Your municipal waste management bill has been settled.
            </p>

            {txDetails && (
              <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-left space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono font-medium text-slate-800">{txDetails.txRef}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">
                    NPR {txDetails.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Gateway:</span>
                  <span className="font-medium text-slate-700">eSewa ePay v2</span>
                </div>
              </div>
            )}

            <Button
              onClick={() => router.push('/invoices')}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              <Receipt className="w-4 h-4 mr-2" />
              View Invoices & Receipts
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-1">
              Payment Failed or Cancelled
            </h1>
            <p className="text-[14px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3 my-4 w-full">
              {errorMessage}
            </p>

            <Button
              variant="outline"
              onClick={() => router.push('/invoices')}
              className="w-full h-11 font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Invoices
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EsewaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <EsewaCallbackContent />
    </Suspense>
  );
}

