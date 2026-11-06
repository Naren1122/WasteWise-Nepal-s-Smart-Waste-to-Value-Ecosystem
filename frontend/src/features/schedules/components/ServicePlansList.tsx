'use client';

import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/stores/auth.store';
import { CreateServicePlanDialog } from './CreateServicePlanDialog';
import { SubscribePropertyDialog } from './SubscribePropertyDialog';
import { useDeleteServicePlan } from '../hooks/useSchedules';
import type { ServicePlan } from '../types/schedules.types';
import { ApiClientError } from '@/shared/lib/api-client';
import { ShieldCheck, Tag, Plus, Check, Trash2, AlertCircle } from 'lucide-react';

interface ServicePlansListProps {
  plans: ServicePlan[];
  isLoading: boolean;
}

export function ServicePlansList({ plans, isLoading }: ServicePlansListProps) {
  const { user } = useAuthStore();
  const isAdmin = user && ['MUNICIPAL_ADMIN', 'SUPER_ADMIN'].includes(user.role);

  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [selectedPlanForSub, setSelectedPlanForSub] = useState<ServicePlan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const deletePlanMutation = useDeleteServicePlan();

  const handleDeletePlan = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${name}"?`)) {
      return;
    }
    setActionError(null);
    try {
      await deletePlanMutation.mutateAsync(id);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setActionError(err.message);
        return;
      }
      setActionError(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center bg-white border border-slate-200 rounded-xl">
        <p className="text-[14px] text-slate-500 animate-pulse">Loading municipal tariffs...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-[12px] font-bold underline hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h3 className="text-base sm:text-[17px] font-bold text-slate-900">
            Municipal Waste Service Plans & Tariffs
          </h3>
          <p className="text-[12.5px] sm:text-[13px] text-slate-500">
            Approved municipal subscription tiers and monthly fees by premises classification
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => setCreatePlanOpen(true)}
            className="h-9 px-3 text-[12.5px] font-bold rounded-lg border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 self-start sm:self-auto gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Plan Tier</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
            No service plans currently active.
          </div>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {plan.propertyType}
                  </span>
                  <Badge variant="outline" className="text-[11px] font-mono font-bold text-slate-600">
                    <Tag className="w-3 h-3 mr-1 text-slate-400" />
                    {plan.code}
                  </Badge>
                </div>

                <h4 className="text-[16px] font-bold text-slate-900">{plan.name}</h4>

                {plan.description && (
                  <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Includes {plan.wasteType} Collection</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl sm:text-[22px] font-extrabold text-slate-900 font-mono">
                      NPR {plan.monthlyRateNpr.toLocaleString()}
                    </span>
                    <span className="text-[12.5px] text-slate-500 ml-1">/ mo</span>
                  </div>

                  {typeof plan.activeSubscriptionsCount === 'number' && (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {plan.activeSubscriptionsCount} Subscribed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPlanForSub(plan)}
                    className="flex-1 h-9 text-[12.5px] font-bold border-slate-200 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50/50 rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>Subscribe Premises</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id, plan.name)}
                      disabled={deletePlanMutation.isPending}
                      className="h-9 px-2.5 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg shrink-0"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Admin Create Plan Modal */}
      <CreateServicePlanDialog
        open={createPlanOpen}
        onOpenChange={setCreatePlanOpen}
      />

      {/* Citizen / Admin Subscribe Modal */}
      <SubscribePropertyDialog
        plan={selectedPlanForSub}
        open={!!selectedPlanForSub}
        onOpenChange={(open) => !open && setSelectedPlanForSub(null)}
      />
    </div>
  );
}
