'use client';

import React, { useState } from 'react';
import { useCreateWard } from '../hooks/useWardsAdmin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Building2, AlertCircle } from 'lucide-react';

interface CreateWardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (wardId: string) => void;
}

export function CreateWardDialog({ open, onOpenChange, onCreated }: CreateWardDialogProps) {
  const [wardNumber, setWardNumber] = useState<string>('');
  const [officeAddress, setOfficeAddress] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createWardMutation = useCreateWard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedNumber = parseInt(wardNumber, 10);
    if (isNaN(parsedNumber) || parsedNumber <= 0) {
      setErrorMessage('Please enter a valid positive ward number.');
      return;
    }

    try {
      const created = await createWardMutation.mutateAsync({
        wardNumber: parsedNumber,
        officeAddress: officeAddress.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      });

      // Reset form and close
      setWardNumber('');
      setOfficeAddress('');
      setContactPhone('');
      onOpenChange(false);
      onCreated?.(created.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create ward. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-white rounded-xl shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Add Municipal Ward
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13.5px] text-slate-500">
            Define a new official administrative ward boundary for your municipality.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-[13px] text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700">
              Ward Number <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              max="99"
              placeholder="e.g. 5"
              value={wardNumber}
              onChange={(e) => setWardNumber(e.target.value)}
              required
              className="h-10 text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700">
              Ward Office Address (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Thamel, Ward Office Building"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              className="h-10 text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700">
              Contact Phone (Optional)
            </label>
            <Input
              type="tel"
              placeholder="e.g. +977-01-4412345"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="h-10 text-[14px]"
            />
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 text-[14px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createWardMutation.isPending}
              className="h-10 px-4 text-[14px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
            >
              {createWardMutation.isPending ? 'Creating...' : 'Create Ward'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

