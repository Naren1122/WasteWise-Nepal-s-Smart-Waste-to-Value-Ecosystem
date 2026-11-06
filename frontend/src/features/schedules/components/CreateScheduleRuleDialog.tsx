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
import { useCreateScheduleRule } from '../hooks/useSchedules';
import type { WasteType } from '../types/schedules.types';
import { CalendarPlus, AlertCircle } from 'lucide-react';

const DAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

interface CreateScheduleRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWardId?: string;
}

export function CreateScheduleRuleDialog({
  open,
  onOpenChange,
  defaultWardId,
}: CreateScheduleRuleDialogProps) {
  const { data: wards } = useWards();
  const createRuleMutation = useCreateScheduleRule();

  const [wardId, setWardId] = useState(defaultWardId && defaultWardId !== 'ALL' ? defaultWardId : '');
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [wasteType, setWasteType] = useState<WasteType>('ORGANIC');
  const [startTime, setStartTime] = useState('06:30');
  const [endTime, setEndTime] = useState('09:30');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!wardId) {
      setErrorMsg('Please select a municipal ward.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    try {
      await createRuleMutation.mutateAsync({
        wardId,
        dayOfWeek: Number(dayOfWeek),
        wasteType,
        startTime,
        endTime,
        isActive: true,
      });

      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create collection rule';
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 bg-white rounded-2xl border border-slate-200">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Add Collection Schedule Rule
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            Define a recurring weekly pickup time window for a municipal ward.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[12.5px] font-semibold text-slate-800">Municipal Ward *</label>
            <Select value={wardId} onValueChange={setWardId}>
              <SelectTrigger className="h-9 text-[13px] border-slate-200 rounded-lg">
                <SelectValue placeholder="Select Ward" />
              </SelectTrigger>
              <SelectContent>
                {wards?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    Ward No. {w.wardNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-slate-800">Day of Week *</label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="h-9 text-[13px] border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-slate-800">Start Time (24h) *</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 text-[13px] font-mono border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-slate-800">End Time (24h) *</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9 text-[13px] font-mono border-slate-200 rounded-lg"
              />
            </div>
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
              isLoading={createRuleMutation.isPending}
              className="h-9 text-[13px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white"
            >
              Save Schedule Rule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

