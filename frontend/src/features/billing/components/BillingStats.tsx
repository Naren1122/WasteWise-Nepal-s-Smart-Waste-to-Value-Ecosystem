'use client';

import React from 'react';
import type { InvoiceDetailDto } from '../types/billing.types';
import { Receipt, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface BillingStatsProps {
  invoices: InvoiceDetailDto[];
}

export function BillingStats({ invoices }: BillingStatsProps) {
  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');

  const totalOutstanding = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalCollected = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Outstanding */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-slate-500">Total Outstanding</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[20px] font-bold text-slate-900">
          NPR {totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <p className="text-[12px] text-slate-400 mt-0.5">
          {pendingInvoices.length + overdueInvoices.length} unpaid bill(s)
        </p>
      </div>

      {/* Total Settled */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-slate-500">Total Paid</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[20px] font-bold text-emerald-600">
          NPR {totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <p className="text-[12px] text-slate-400 mt-0.5">{paidInvoices.length} settled payment(s)</p>
      </div>

      {/* Pending Invoices */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-slate-500">Pending</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[20px] font-bold text-slate-900">{pendingInvoices.length}</div>
        <p className="text-[12px] text-slate-400 mt-0.5">Awaiting digital / cash settlement</p>
      </div>

      {/* Overdue */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-slate-500">Overdue</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[20px] font-bold text-rose-600">{overdueInvoices.length}</div>
        <p className="text-[12px] text-slate-400 mt-0.5">Past statutory due date</p>
      </div>
    </div>
  );
}

