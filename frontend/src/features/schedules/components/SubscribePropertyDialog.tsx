'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useMyProperties } from '@/features/properties/hooks/useProperties';
import { useCreateSubscription } from '../hooks/useSchedules';
import type { ServicePlan } from '../types/schedules.types';
import { ApiClientError } from '@/shared/lib/api-client';
import { CheckCircle2, AlertCircle, Home, AlertTriangle } from 'lucide-react';

interface SubscribePropertyDialogProps {
  plan: ServicePlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribePropertyDialog({
  plan,
  open,
  onOpenChange,
}: SubscribePropertyDialogProps) {
  const { data: properties, isLoading: loadingProperties } = useMyProperties();
  const createSubMutation = useCreateSubscription();

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const eligibleProperties = (properties || []).filter(
    (prop) => prop.propertyType === plan?.propertyType
  );

  if (!plan) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedPropertyId) {
      setErrorMsg('Please select a registered property premises.');
      return;
    }

    try {
      await createSubMutation.mutateAsync({
        propertyId: selectedPropertyId,
        planId: plan.id,
      });

      setSuccessMsg('Property successfully subscribed to this service plan!');
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedPropertyId('');
        onOpenChange(false);
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (typeof err.details === 'object' && err.details !== null) {
          const detailMsgs = Object.values(err.details).flat().join('. ');
          if (detailMsgs) {
            setErrorMsg(detailMsgs);
            return;
          }
        }
        setErrorMsg(err.message);
        return;
      }
      const msg = err instanceof Error ? err.message : 'Subscription failed';
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 bg-white rounded-2xl border border-slate-200">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Home className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Subscribe Premises
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            Enroll your property in the <strong>{plan.name}</strong> ({plan.code}) plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubscribe} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Plan Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-slate-500">Classification:</span>
              <span className="font-bold text-slate-800">{plan.propertyType}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-slate-500">Included Stream:</span>
              <span className="font-bold text-emerald-800">{plan.wasteType} Waste</span>
            </div>
            <div className="flex items-center justify-between text-[13px] pt-1 border-t border-slate-200/60">
              <span className="text-slate-700 font-semibold">Monthly Tariff:</span>
              <span className="font-bold font-mono text-slate-900">
                NPR {plan.monthlyRateNpr.toLocaleString()} / mo
              </span>
            </div>
          </div>

          {/* Property Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">
              Select Your Premises *
            </label>
            {!loadingProperties && eligibleProperties.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[12px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  No registered <strong>{plan.propertyType}</strong> properties found under your account. This tariff applies strictly to premises classified as <strong>{plan.propertyType}</strong>.
                </span>
              </div>
            ) : (
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="h-10 text-[13px] border-slate-200 rounded-lg">
                  <SelectValue
                    placeholder={loadingProperties ? 'Loading eligible properties...' : `Choose ${plan.propertyType} Property`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {eligibleProperties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      Ward {prop.wardNumber ?? '1'} - {prop.streetAddress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-[13px] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={eligibleProperties.length === 0 || !selectedPropertyId}
              isLoading={createSubMutation.isPending}
              className="h-9 text-[13px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white disabled:opacity-50"
            >
              Confirm Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

