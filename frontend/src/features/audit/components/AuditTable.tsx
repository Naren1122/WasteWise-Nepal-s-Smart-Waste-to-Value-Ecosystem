'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuditLogDetailItem } from './AuditDiffModal';

interface AuditTableProps {
  logs: AuditLogDetailItem[];
  isLoading: boolean;
  pagination: { page: number; totalPages: number; totalItems: number };
  onPageChange: (newPage: number) => void;
  onInspect: (log: AuditLogDetailItem) => void;
  getActionBadgeVariant: (action: string) => 'active' | 'info' | 'pending' | 'destructive' | 'default';
}

export function AuditTable({
  logs,
  isLoading,
  pagination,
  onPageChange,
  onInspect,
  getActionBadgeVariant,
}: AuditTableProps) {
  return (
    <Card className="p-0 overflow-hidden border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[14px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[13px]">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No audit records matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {log.entityType} <span className="text-slate-400 text-[12px]">({log.entityId.slice(0, 8)})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {log.actorUserName ?? 'System Worker'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[13px]">
                    {log.actorRole ?? 'SYSTEM'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[12px] text-slate-500">
                    {log.ipAddress ?? 'internal'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[13px]">
                    {new Date(log.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInspect(log)}
                      className="h-8 gap-1 text-slate-600 hover:text-emerald-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[13px] text-slate-500">
        <span>
          Page {pagination.page} of {Math.max(1, pagination.totalPages)} ({pagination.totalItems} total logs)
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="h-8 gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="h-8 gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

