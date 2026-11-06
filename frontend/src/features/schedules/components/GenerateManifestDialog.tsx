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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useWards } from '@/features/properties/hooks/useProperties';
import { useGenerateDailyPickups } from '../hooks/useSchedules';
import { Truck, CheckCircle2, AlertCircle } from 'lucide-react';

interface GenerateManifestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateManifestDialog({ open, onOpenChange }: GenerateManifestDialogProps) {
  const { data: wards } = useWards();
  const generateMutation = useGenerateDailyPickups();

  const todayStr = new Date().toISOString().split('T')[0] ?? '';
  const [targetDate, setTargetDate] = useState(todayStr);
  const [wardId, setWardId] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResultMsg(null);

    if (!targetDate) {
      setErrorMsg('Please select a target date.');
      return;
    }

    try {
      const res = await generateMutation.mutateAsync({
        targetDate,
        wardId: wardId !== 'ALL' ? wardId : undefined,
      });

      setResultMsg(res.data?.message || 'Daily pickup manifest generated successfully!');
      setTimeout(() => {
        setResultMsg(null);
        onOpenChange(false);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Manifest generation failed';
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 bg-white rounded-2xl border border-slate-200">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Truck className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Generate Pickup Manifest
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            Automatically create scheduled collection stops for subscribed properties.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{resultMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[12.5px] font-semibold text-slate-800">Target Date *</label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-10 text-[13px] border-slate-200 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12.5px] font-semibold text-slate-800">Ward Scope</label>
            <Select value={wardId} onValueChange={setWardId}>
              <SelectTrigger className="h-10 text-[13px] border-slate-200 rounded-lg">
                <SelectValue placeholder="All Active Wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Active Wards</SelectItem>
                {wards?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    Ward No. {w.wardNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              isLoading={generateMutation.isPending}
              className="h-9 text-[13px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white"
            >
              Generate Manifest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

