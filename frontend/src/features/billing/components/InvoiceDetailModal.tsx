'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import type { InvoiceDetailDto } from '../types/billing.types';
import { CreditCard, Banknote, Calendar, MapPin, User } from 'lucide-react';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetailDto | null;
  onPayDigital?: (invoice: InvoiceDetailDto) => void;
  onPayCash?: (invoice: InvoiceDetailDto) => void;
  isStaff?: boolean;
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onPayDigital,
  onPayCash,
  isStaff = false,
}: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const isUnpaid = invoice.status === 'PENDING' || invoice.status === 'OVERDUE';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-6">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-[18px] font-bold text-slate-900">
                {invoice.invoiceNumber}
              </DialogTitle>
              <Badge
                variant={
                  invoice.status === 'PAID'
                    ? 'default'
                    : invoice.status === 'OVERDUE'
                    ? 'destructive'
                    : 'secondary'
                }
                className="text-[11px] font-semibold uppercase"
              >
                {invoice.status}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Period: {invoice.billingMonth}/{invoice.billingYear}
            </p>
          </div>
        </DialogHeader>

        {/* Citizen & Property Context */}
        <div className="grid grid-cols-2 gap-3 py-2 text-[13px] bg-slate-50 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block">{invoice.citizenName}</span>
              <span className="text-slate-500">{invoice.citizenPhone}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-medium text-slate-700 block truncate max-w-[200px]">
                {invoice.propertyAddress}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden my-2">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Rate</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3">
                    <span className="font-medium text-slate-800 block">{item.description}</span>
                    <span className="text-[11px] text-slate-400 uppercase">{item.itemType}</span>
                  </td>
                  <td className="py-2 px-3 text-right">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">NPR {item.unitPrice.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900">
                    NPR {item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Summary */}
          <div className="bg-slate-50/80 p-3 border-t border-slate-200 space-y-1 text-[13px]">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>NPR {invoice.subtotalAmount.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>- NPR {invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>NPR {invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[16px] text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Payable</span>
              <span className="text-emerald-700">
                NPR {invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="outline" onClick={onClose} className="h-10 px-4">
            Close
          </Button>

          {isUnpaid && isStaff && onPayCash && (
            <Button
              onClick={() => {
                onClose();
                onPayCash(invoice);
              }}
              variant="secondary"
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800"
            >
              <Banknote className="w-4 h-4 mr-1.5" />
              Counter Cash
            </Button>
          )}

          {isUnpaid && onPayDigital && (
            <Button
              onClick={() => {
                onClose();
                onPayDigital(invoice);
              }}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              Pay Online
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

