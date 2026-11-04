'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import type { ServicePlan } from '../types/schedules.types';

interface ServicePlansListProps {
  plans: ServicePlan[];
  isLoading: boolean;
}

export function ServicePlansList({ plans, isLoading }: ServicePlansListProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-32 flex items-center justify-center text-slate-400 text-[15px]">
          Loading municipal service plans...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[17px] font-semibold text-slate-900">Municipal Service Plans & Tariffs</h3>
        <p className="text-[14px] text-slate-500">Official waste collection subscription tiers and monthly fees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-400 text-[14px]">
            No service plans configured.
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                    {plan.propertyType}
                  </span>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {plan.code}
                  </Badge>
                </div>
                <h4 className="text-[16px] font-semibold text-slate-900">{plan.name}</h4>
                {plan.description && (
                  <p className="text-[13px] text-slate-500 line-clamp-2">{plan.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[20px] font-bold text-slate-900">
                    NPR {plan.monthlyRateNpr.toLocaleString()}
                  </span>
                  <span className="text-[13px] text-slate-500 ml-1">/ month</span>
                </div>
                {typeof plan.activeSubscriptionsCount === 'number' && (
                  <span className="text-[12px] text-slate-500">
                    {plan.activeSubscriptionsCount} active
                  </span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
