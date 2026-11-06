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
import { useMyProperties } from '@/features/properties/hooks/useProperties';
import { useCreateBulkyWasteRequest } from '../hooks/useSchedules';
import { PackageOpen, AlertCircle } from 'lucide-react';

interface BookBulkyPickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookBulkyPickupDialog({ open, onOpenChange }: BookBulkyPickupDialogProps) {
  const { data: properties, isLoading: loadingProperties } = useMyProperties();
  const createMutation = useCreateBulkyWasteRequest();

  const [propertyId, setPropertyId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [estimatedVolume, setEstimatedVolume] = useState('Medium (~1-3 m³)');
  const [preferredDate, setPreferredDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Minimum date for Nepal: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split('T')[0] ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!propertyId) {
      setErrorMsg('Please select a registered property premises.');
      return;
    }
    if (!itemDescription.trim()) {
      setErrorMsg('Please describe the items to be collected.');
      return;
    }
    if (!preferredDate) {
      setErrorMsg('Please select a preferred pickup date.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        propertyId,
        itemDescription: itemDescription.trim(),
        estimatedVolume,
        preferredDate,
      });

      // Reset & close
      setPropertyId('');
      setItemDescription('');
      setPreferredDate('');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit bulky waste request';
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-2xl border border-slate-200">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <PackageOpen className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Book Bulky Waste Pickup
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            Request on-demand collection for furniture, construction debris, or electronics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Property Selector */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-slate-800">
              Registered Property *
            </label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="h-10 text-[13.5px] border-slate-200 rounded-lg">
                <SelectValue placeholder={loadingProperties ? 'Loading properties...' : 'Select Premises'} />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Ward {p.wardNumber ?? '1'} - {p.streetAddress}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item Description */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-slate-800">
              Item Details & Quantity *
            </label>
            <Textarea
              placeholder="e.g. 1 Wooden Wardrobe, 2 old foam mattresses, and garden tree branches"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="h-20 text-[13.5px] border-slate-200 rounded-lg resize-none"
            />
          </div>

          {/* Volume and Preferred Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-800">
                Estimated Volume
              </label>
              <Select value={estimatedVolume} onValueChange={setEstimatedVolume}>
                <SelectTrigger className="h-10 text-[13px] border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small (< 1 m³)">Small (&lt; 1 m³)</SelectItem>
                  <SelectItem value="Medium (~1-3 m³)">Medium (~1-3 m³)</SelectItem>
                  <SelectItem value="Large (> 3 m³)">Large (&gt; 3 m³)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-800">
                Preferred Date *
              </label>
              <Input
                type="date"
                min={minDateString}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="h-10 text-[13px] border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 text-[13.5px] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
              className="h-10 text-[13.5px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white"
            >
              Submit for Ward Quote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
