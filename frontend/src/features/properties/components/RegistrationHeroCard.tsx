'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Building2 } from 'lucide-react';

export function RegistrationHeroCard() {
  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Register New Premises
          </h1>
          <p className="text-[13px] sm:text-[14px] text-slate-500 leading-relaxed max-w-2xl">
            Provide municipal ward jurisdiction, property classification, and pinpoint geolocation for automated waste route allocation and digital municipal billing.
          </p>
        </div>
      </div>
    </Card>
  );
}
