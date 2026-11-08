'use client';

import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { X, ShieldAlert } from 'lucide-react';

export interface AuditLogDetailItem {
  id: string;
  actorUserName: string | null;
  actorRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  entityType: string;
  entityId: string;
  action: string;
  description: string | null;
  diffBefore?: unknown;
  diffAfter?: unknown;
  createdAt: string;
}

interface AuditDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogDetailItem | null;
}

export function AuditDiffModal({ isOpen, onClose, log }: AuditDiffModalProps) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <h3 className="text-[17px] font-bold text-slate-900">
              Audit Event: {log.entityType} ({log.action})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-[14px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-[13px]">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Actor</span>
              <span className="font-medium text-slate-800">{log.actorUserName ?? 'System'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Role</span>
              <Badge variant="outline">{log.actorRole ?? 'N/A'}</Badge>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">IP Address</span>
              <span className="font-mono text-slate-700">{log.ipAddress ?? 'N/A'}</span>
            </div>
          </div>

          {log.description && (
            <p className="text-slate-600 bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg text-[13px]">
              <span className="font-semibold text-emerald-900">Note:</span> {log.description}
            </p>
          )}

          {/* Diffs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-[12px] font-semibold text-slate-500 uppercase block mb-1">
                Before State
              </span>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[12px] font-mono overflow-x-auto max-h-56">
                {log.diffBefore ? JSON.stringify(log.diffBefore, null, 2) : '// No previous state'}
              </pre>
            </div>

            <div>
              <span className="text-[12px] font-semibold text-slate-500 uppercase block mb-1">
                After State (Mutation)
              </span>
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[12px] font-mono overflow-x-auto max-h-56">
                {log.diffAfter ? JSON.stringify(log.diffAfter, null, 2) : '// No mutated fields'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

