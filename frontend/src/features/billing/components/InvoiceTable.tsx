'use client';

import React from 'react';
import type { InvoiceDetailDto } from '../types/billing.types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Eye, CreditCard, Banknote, Calendar } from 'lucide-react';

interface InvoiceTableProps {
  invoices: InvoiceDetailDto[];
  isLoading: boolean;
  onViewDetails: (invoice: InvoiceDetailDto) => void;
  onPayDigital?: (invoice: InvoiceDetailDto) => void;
  onPayCash?: (invoice: InvoiceDetailDto) => void;
  isStaff?: boolean;
}

export function InvoiceTable({
  invoices,
  isLoading,
  onViewDetails,
  onPayDigital,
  onPayCash,
  isStaff = false,
}: InvoiceTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        <Calendar className="w-10 h-10 mx-auto text-slate-400 mb-2" />
        <h3 className="font-semibold text-slate-800 text-[16px]">No Invoices Found</h3>
        <p className="text-[14px] mt-1">There are no billing records matching the selected criteria.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Stacked Card View (< 640px) */}
      <div className="block sm:hidden space-y-3">
        {invoices.map((inv) => {
          const isUnpaid = inv.status === 'ISSUED' || inv.status === 'OVERDUE';
          return (
            <div
              key={inv.id}
              className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-[15px] text-slate-900 block">
                    {inv.invoiceNumber}
                  </span>
                  <span className="text-[12px] text-slate-500">
                    Period: {inv.billingMonth}/{inv.billingYear}
                  </span>
                </div>
                <Badge
                  variant={
                    inv.status === 'PAID'
                      ? 'default'
                      : inv.status === 'OVERDUE'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-[11px] uppercase font-semibold"
                >
                  {inv.status}
                </Badge>
              </div>

              <div className="text-[13px] text-slate-600 space-y-1">
                <div>
                  <span className="text-slate-400">Citizen: </span>
                  <span className="font-medium text-slate-800">{inv.citizenName}</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-400">Property: </span>
                  <span>{inv.propertyAddress}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Amount</span>
                  <span className="text-[16px] font-bold text-emerald-700">
                    NPR {inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(inv)}
                    className="h-9 px-3"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {isUnpaid && isStaff && onPayCash && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onPayCash(inv)}
                      className="h-9 px-3 bg-slate-100 text-slate-800 font-medium"
                    >
                      <Banknote className="w-4 h-4" />
                    </Button>
                  )}

                  {isUnpaid && onPayDigital && (
                    <Button
                      size="sm"
                      onClick={() => onPayDigital(inv)}
                      className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pay
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop / Tablet Table View (>= 640px) */}
      <div className="hidden sm:block border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[13px]">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Citizen / Property</th>
              <th className="py-3 px-4 text-right">Amount (NPR)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoices.map((inv) => {
              const isUnpaid = inv.status === 'ISSUED' || inv.status === 'OVERDUE';
              return (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {inv.billingMonth}/{inv.billingYear}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800 block">{inv.citizenName}</span>
                    <span className="text-[12px] text-slate-500 truncate max-w-[220px] block">
                      {inv.propertyAddress}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge
                      variant={
                        inv.status === 'PAID'
                          ? 'default'
                          : inv.status === 'OVERDUE'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-[11px] font-semibold uppercase"
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(inv)}
                        className="h-8 px-2.5 text-[13px]"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>

                      {isUnpaid && isStaff && onPayCash && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onPayCash(inv)}
                          className="h-8 px-2.5 text-[13px] bg-slate-100 hover:bg-slate-200 text-slate-800"
                        >
                          <Banknote className="w-3.5 h-3.5 mr-1" />
                          Cash
                        </Button>
                      )}

                      {isUnpaid && onPayDigital && (
                        <Button
                          size="sm"
                          onClick={() => onPayDigital(inv)}
                          className="h-8 px-3 text-[13px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Pay
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
    </>
  );
}

