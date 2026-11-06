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
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useCreateServicePlan } from '../hooks/useSchedules';
import type { PropertyType, WasteType } from '../types/schedules.types';
import { Layers, AlertCircle } from 'lucide-react';

interface CreateServicePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateServicePlanDialog({ open, onOpenChange }: CreateServicePlanDialogProps) {
  const createPlanMutation = useCreateServicePlan();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('RESIDENTIAL');
  const [wasteType, setWasteType] = useState<WasteType>('ORGANIC');
  const [monthlyRateNpr, setMonthlyRateNpr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rate = Number(monthlyRateNpr);
    if (!name.trim() || !code.trim() || isNaN(rate) || rate < 0) {
      setErrorMsg('Please enter a valid plan name, code, and non-negative rate.');
      return;
    }

    try {
      await createPlanMutation.mutateAsync({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        propertyType,
        wasteType,
        monthlyRateNpr: rate,
        isActive: true,
      });

      setName('');
      setCode('');
      setDescription('');
      setMonthlyRateNpr('');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create service plan';
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-2xl border border-slate-200">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Layers className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Create Service Plan & Tariff
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            Define a monthly municipal waste tariff by property type and waste stream.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-slate-800">Plan Name *</label>
              <Input
                placeholder="Residential Standard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-[13px] border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-slate-800">Plan Code *</label>
              <Input
                placeholder="RES-STD"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-9 text-[13px] font-mono border-slate-200 rounded-lg uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-slate-800">Property Type *</label>
              <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                <SelectTrigger className="h-9 text-[13px] border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                  <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                  <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-slate-800">Waste Stream *</label>
              <Select value={wasteType} onValueChange={(v) => setWasteType(v as WasteType)}>
                <SelectTrigger className="h-9 text-[13px] border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORGANIC">Organic</SelectItem>
                  <SelectItem value="RECYCLABLE">Recyclable</SelectItem>
                  <SelectItem value="HAZARDOUS">Hazardous</SelectItem>
                  <SelectItem value="BULKY">Bulky</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12.5px] font-semibold text-slate-800">Monthly Rate (NPR) *</label>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={monthlyRateNpr}
              onChange={(e) => setMonthlyRateNpr(e.target.value)}
              className="h-9 text-[13px] font-mono border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12.5px] font-semibold text-slate-800">Description (Optional)</label>
            <Textarea
              placeholder="Features, pickup frequency, and municipal billing cycle terms"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-16 text-[13px] border-slate-200 rounded-lg resize-none"
            />
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
              isLoading={createPlanMutation.isPending}
              className="h-9 text-[13px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white"
            >
              Save Service Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

