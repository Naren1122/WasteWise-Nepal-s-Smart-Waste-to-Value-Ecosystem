'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { useMyInvoices, useInvoices, useGenerateMonthlyInvoices } from '@/features/billing/api/useInvoices';
import { BillingStats } from '@/features/billing/components/BillingStats';
import { InvoiceTable } from '@/features/billing/components/InvoiceTable';
import { InvoiceDetailModal } from '@/features/billing/components/InvoiceDetailModal';
import { CashCounterModal } from '@/features/billing/components/CashCounterModal';
import { PaymentModal } from '@/features/payments/components/PaymentModal';
import { ReceiptModal } from '@/features/payments/components/ReceiptModal';
import type { InvoiceDetailDto, InvoiceStatus } from '@/features/billing/types/billing.types';
import type { PaymentReceiptDto } from '@/features/payments/types/payments.types';
import { RefreshCw, PlayCircle, Loader2 } from 'lucide-react';

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const isStaff = Boolean(
    user?.role && ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER'].includes(user.role)
  );

  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | undefined>(undefined);
  const [page] = useState<number>(1);

  // Modals state
  const [detailInvoice, setDetailInvoice] = useState<InvoiceDetailDto | null>(null);
  const [digitalPayInvoice, setDigitalPayInvoice] = useState<InvoiceDetailDto | null>(null);
  const [cashPayInvoice, setCashPayInvoice] = useState<InvoiceDetailDto | null>(null);
  const [viewReceipt, setViewReceipt] = useState<PaymentReceiptDto | null>(null);

  // Queries (only active role query is enabled)
  const citizenQuery = useMyInvoices({ status: selectedStatus, page }, { enabled: !isStaff });
  const staffQuery = useInvoices({ status: selectedStatus, page }, { enabled: isStaff });

  const activeQuery = isStaff ? staffQuery : citizenQuery;
  const invoices = activeQuery.data?.items ?? [];
  const isLoading = activeQuery.isLoading;

  const generateMonthly = useGenerateMonthlyInvoices();

  const handleRunMonthlyBilling = async () => {
    if (!window.confirm('Trigger automated recurring billing generation for all active municipal subscriptions?')) {
      return;
    }
    await generateMonthly.mutateAsync({});
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-12">
      <PageHeader
        title="Invoices & Payments"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => activeQuery.refetch()}
              disabled={activeQuery.isFetching}
              className="h-9 px-3 text-[13px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${activeQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {isStaff && (
              <Button
                size="sm"
                onClick={handleRunMonthlyBilling}
                disabled={generateMonthly.isPending}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[13px]"
              >
                {generateMonthly.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Run Monthly Cycle
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Real-time Financial Metrics */}
        <BillingStats invoices={invoices} />

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {(
            [
              { label: 'All Invoices', value: undefined },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Overdue', value: 'OVERDUE' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.label}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                selectedStatus === tab.value
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Invoices List / Table */}
        <InvoiceTable
          invoices={invoices}
          isLoading={isLoading}
          isStaff={isStaff}
          onViewDetails={(inv) => setDetailInvoice(inv)}
          onPayDigital={(inv) => setDigitalPayInvoice(inv)}
          onPayCash={(inv) => setCashPayInvoice(inv)}
        />
      </div>

      {/* Modals */}
      <InvoiceDetailModal
        isOpen={Boolean(detailInvoice)}
        onClose={() => setDetailInvoice(null)}
        invoice={detailInvoice}
        isStaff={isStaff}
        onPayDigital={(inv) => setDigitalPayInvoice(inv)}
        onPayCash={(inv) => setCashPayInvoice(inv)}
      />

      <PaymentModal
        isOpen={Boolean(digitalPayInvoice)}
        onClose={() => setDigitalPayInvoice(null)}
        invoice={digitalPayInvoice}
      />

      <CashCounterModal
        isOpen={Boolean(cashPayInvoice)}
        onClose={() => setCashPayInvoice(null)}
        invoice={cashPayInvoice}
        onSuccess={(receipt) => setViewReceipt(receipt)}
      />

      <ReceiptModal
        isOpen={Boolean(viewReceipt)}
        onClose={() => setViewReceipt(null)}
        receipt={viewReceipt}
      />
    </div>
  );
}

