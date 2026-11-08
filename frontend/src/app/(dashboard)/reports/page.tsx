'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Wallet,
  AlertCircle,
  Truck,
  Award,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Fiscal Year', value: 'this_fiscal_year' },
];

interface ReportCardConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  endpoint: string;
  filename: string;
  icon: React.ElementType;
  badge: { label: string; variant: 'active' | 'info' | 'pending' | 'default' };
}

const REPORT_CARDS: ReportCardConfig[] = [
  { id: 'collections', title: 'Daily Collection & Stops Manifest', category: 'Operations', description: 'Detailed log of route outcomes, collected vs missed stops, assigned vehicles, and drivers.', endpoint: '/reports/export/collections', filename: 'collections-report.csv', icon: Truck, badge: { label: 'Route Data', variant: 'active' } },
  { id: 'financial', title: 'Financial Reconciliation Ledger', category: 'Finance', description: 'Audit-ready transaction records, eSewa/Khalti digital settlement, invoice numbers, and receipts.', endpoint: '/reports/export/financial-reconciliation', filename: 'financial-reconciliation.csv', icon: Wallet, badge: { label: 'Audit Ready', variant: 'info' } },
  { id: 'complaints', title: 'Grievance & SLA Redressal Audit', category: 'Citizen Redressal', description: 'Citizen tickets, assigned officers, turnaround time in hours, and SLA compliance flags.', endpoint: '/reports/export/complaints-sla', filename: 'complaints-sla-report.csv', icon: AlertCircle, badge: { label: 'SLA Logs', variant: 'pending' } },
  { id: 'ward-summary', title: 'Ward Performance Summary Sheet', category: 'Executive Council', description: 'Comparative municipal rankings, collection efficiencies, and grievance closure rates by ward.', endpoint: '/reports/export/ward-summary', filename: 'ward-summary-report.csv', icon: Award, badge: { label: 'Council Report', variant: 'default' } },
];

export default function ReportsPage() {
  const [preset, setPreset] = useState('this_month');
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const downloadReport = async (report: ReportCardConfig) => {
    setDownloading((prev) => ({ ...prev, [report.id]: true }));
    try {
      const tokensRaw = localStorage.getItem('wastewise_tokens');
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
      const tenantId = localStorage.getItem('wastewise_tenant_id') || '';

      const url = `${API_BASE_URL}${report.endpoint}?preset=${preset}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : '',
          'X-Tenant-ID': tenantId,
        },
      });

      if (!response.ok) throw new Error(`Failed to export report: ${response.statusText}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${report.id}-${preset}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('[Reports] Export error:', err);
      alert('Unable to generate export. Please verify your permissions and try again.');
    } finally {
      setDownloading((prev) => ({ ...prev, [report.id]: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/analytics" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight">
              Reports & Data Exports
            </h1>
          </div>
          <p className="text-[14px] sm:text-[15px] text-slate-500">
            Generate and stream audit-ready CSV exports for municipal councils and regulatory compliance
          </p>
        </div>

        {/* Time Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`h-9 px-3 text-[13px] font-medium rounded-lg transition-colors min-h-[40px] sm:min-h-[36px] ${
                preset === p.value
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid (Responsive: 1-col mobile, 2-col tablet/desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {REPORT_CARDS.map((report) => {
          const Icon = report.icon;
          const isBusy = Boolean(downloading[report.id]);

          return (
            <Card key={report.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant={report.badge.variant}>{report.badge.label}</Badge>
                </div>

                <h3 className="text-[17px] font-semibold text-slate-900 mb-1.5">
                  {report.title}
                </h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Format: RFC-4180 CSV
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => downloadReport(report)}
                  disabled={isBusy}
                  className="gap-2"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isBusy ? 'Exporting...' : 'Export CSV'}</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
