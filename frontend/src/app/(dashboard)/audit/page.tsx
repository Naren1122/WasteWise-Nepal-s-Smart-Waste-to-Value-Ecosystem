'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { AuditDiffModal, AuditLogDetailItem } from '@/features/audit/components/AuditDiffModal';
import { AuditTable } from '@/features/audit/components/AuditTable';
import { apiClient } from '@/shared/lib/api-client';
import { ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';

interface PaginatedAuditResult {
  data: AuditLogDetailItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const ACTION_FILTERS = [
  'ALL',
  'CREATE',
  'UPDATE',
  'STATUS_CHANGE',
  'ROUTE_DISPATCH',
  'EXPORT_GENERATED',
  'DELETE',
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDetailItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [activeLog, setActiveLog] = useState<AuditLogDetailItem | null>(null);

  const fetchLogs = async (page: number, action: string) => {
    setIsLoading(true);
    try {
      const actionParam = action !== 'ALL' ? `&action=${action}` : '';
      const res = await apiClient.get<PaginatedAuditResult | { data: AuditLogDetailItem[]; pagination: any }>(
        `/audit-logs?page=${page}&pageSize=15${actionParam}`
      );

      const payload = (res && 'data' in res && res.data ? res.data : res) as unknown as PaginatedAuditResult;
      setLogs(payload.data ?? []);
      if (payload.pagination) {
        setPagination({
          page: payload.pagination.page,
          totalPages: payload.pagination.totalPages,
          totalItems: payload.pagination.totalItems,
        });
      }
    } catch (err) {
      console.error('[Audit] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(pagination.page, selectedAction);
  }, [pagination.page, selectedAction]);

  const getActionBadgeVariant = (action: string): 'active' | 'info' | 'pending' | 'destructive' | 'default' => {
    switch (action) {
      case 'CREATE':
        return 'active';
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return 'info';
      case 'DELETE':
        return 'destructive';
      case 'EXPORT_GENERATED':
        return 'default';
      default:
        return 'pending';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/analytics" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Governance & Audit Trail
            </h1>
          </div>
          <p className="text-[14px] sm:text-[15px] text-slate-500">
            Immutable system audit logs tracking operational, financial, and administrative actions
          </p>
        </div>

        {/* Action Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {ACTION_FILTERS.map((act) => (
            <button
              key={act}
              onClick={() => {
                setSelectedAction(act);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`h-8 px-2.5 text-[12px] font-medium rounded-lg transition-colors ${
                selectedAction === act
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {act}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page, selectedAction)}
            className="h-8 px-2.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Audit Log Table Sub-Component */}
      <AuditTable
        logs={logs}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
        onInspect={(log) => setActiveLog(log)}
        getActionBadgeVariant={getActionBadgeVariant}
      />

      {/* Detailed Diff Modal */}
      <AuditDiffModal
        isOpen={Boolean(activeLog)}
        onClose={() => setActiveLog(null)}
        log={activeLog}
      />
    </div>
  );
}
