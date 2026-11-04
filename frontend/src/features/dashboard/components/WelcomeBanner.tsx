'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Radio } from 'lucide-react';

interface WelcomeBannerProps {
  userName?: string | null;
  tenantSubdomain?: string | null;
}

export function WelcomeBanner({ userName, tenantSubdomain }: WelcomeBannerProps) {
  const municipality = tenantSubdomain?.toUpperCase() || 'KATHMANDU';

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:shadow-sm transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left greeting & municipal jurisdiction */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {userName || 'KMC Municipal Administrator'}
            </h1>
            <Badge variant="outline" className="text-[11px] font-bold text-slate-600 bg-slate-100/80 border-slate-300">
              ZONE-CENTRAL
            </Badge>
          </div>
          <p className="text-[14px] sm:text-[15px] text-slate-600">
            Smart municipal operations, collection routes, and premises registry for{' '}
            <strong className="text-emerald-700 font-semibold">{municipality}</strong>.
          </p>
        </div>

        {/* Right node online & satellite telemetry status */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span className="tracking-wide">NODE ONLINE</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-[12px] font-medium text-slate-600 border border-slate-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Telemetry 100%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

