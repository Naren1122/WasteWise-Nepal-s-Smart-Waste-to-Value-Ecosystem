'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useCreateZone } from '../hooks/useWardsAdmin';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateZoneFormProps {
  wardId: string;
  wardNumber: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateZoneForm({ wardId, wardNumber, onSuccess, onCancel }: CreateZoneFormProps) {
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  const createZoneMutation = useCreateZone();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim() || !zoneCode.trim()) {
      setFormError('Zone Name and Zone Code are required.');
      return;
    }

    setFormError(null);
    setFormSuccess(false);

    try {
      await createZoneMutation.mutateAsync({
        wardId,
        name: zoneName.trim(),
        code: zoneCode.trim().toUpperCase(),
        description: zoneDesc.trim() || undefined,
      });

      setFormSuccess(true);
      setZoneName('');
      setZoneCode('');
      setZoneDesc('');
      setTimeout(() => onSuccess(), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create collection zone';
      setFormError(msg);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden animate-in fade-in-50 duration-200">
      <div className="py-5 sm:py-6 px-4 sm:px-8 text-center border-b border-slate-200/80 bg-slate-50/50">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Add New Service Zone (Tole)
        </h3>
        <p className="text-[13.5px] sm:text-[14px] text-slate-500 mt-1 max-w-md mx-auto">
          Define a waste collection zone under Ward No. {wardNumber}.
        </p>
      </div>

      <div className="p-4 sm:p-8">
        {formError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-[14px] text-rose-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-[14px] text-emerald-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Service Zone created successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
          <Input
            label="Zone / Tole Name *"
            placeholder="e.g. Bhatbhateni Marg Tole"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            required
          />

          <Input
            label="Zone Code *"
            placeholder="e.g. KMC-W1-Z1"
            value={zoneCode}
            onChange={(e) => setZoneCode(e.target.value)}
            required
          />

          <Input
            label="Description / Landmarks (Optional)"
            placeholder="e.g. Covering Bhatbhateni Supermarket and adjacent alleys"
            value={zoneDesc}
            onChange={(e) => setZoneDesc(e.target.value)}
          />

          <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={createZoneMutation.isPending}
              className="w-full sm:w-auto min-w-[180px]"
            >
              Create Service Zone
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

