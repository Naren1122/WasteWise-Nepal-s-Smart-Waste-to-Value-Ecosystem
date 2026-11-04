'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Building2,
  CalendarCheck,
  ShieldCheck,
  Wallet,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface KpiMetricsGridProps {
  roleName?: string;
  propertyCount?: number;
}

export function KpiMetricsGrid({ roleName = 'Municipal Admin', propertyCount = 1 }: KpiMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Registered Premises */}
      <Card className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Registered Premises
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {propertyCount}
              </span>
              <span className="text-[14px] font-semibold text-slate-600">
                {propertyCount === 1 ? 'Property' : 'Properties'}
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
          <span className="text-slate-500">Active collection tier</span>
          <Badge variant="active" className="h-5 px-2 text-[11px] font-bold">
            W-03
          </Badge>
        </div>
      </Card>

      {/* 2. Next Collection */}
      <Card className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Next Pickup
            </span>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 block leading-tight">
                Tomorrow
              </span>
              <span className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide">
                Organic Stream
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
          <span className="text-slate-500 truncate">07:00 AM • Ward 3</span>
          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>On Schedule</span>
          </span>
        </div>
      </Card>

      {/* 3. Account Role */}
      <Card className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Account Role
            </span>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 block leading-tight">
                {roleName}
              </span>
              <span className="text-[12px] font-medium text-slate-500">
                Full Municipal Scope
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
          <span className="text-slate-500 truncate">Kathmandu Metro (KMC)</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
            LVL-4
          </span>
        </div>
      </Card>

      {/* 4. Pending Dues */}
      <Card className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending Dues
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight">
                NPR 0
              </span>
              <span className="text-[12px] font-bold text-emerald-700">
                (Clear)
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
          <span className="text-slate-500">Fiscal Q3 settled</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified</span>
          </span>
        </div>
      </Card>
    </div>
  );
}

