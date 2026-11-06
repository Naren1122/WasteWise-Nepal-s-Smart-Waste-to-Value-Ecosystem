'use client';

import React, { useState, useTransition } from 'react';
import { useGenerateRoute } from '../hooks/useRoutes';
import { useAdminWards } from '@/features/wards/hooks/useWardsAdmin';
import { useVehicles, useEligibleDrivers } from '@/features/fleet/hooks/useFleet';
import { generateDailyRouteSchema } from '../types/routes.types';
import type { WasteType } from '@/features/schedules/types/schedules.types';
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
import { Route as RouteIcon, AlertCircle, Loader2 } from 'lucide-react';

interface GenerateRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: (routeId: string) => void;
}

export function GenerateRouteModal({
  open,
  onOpenChange,
  onGenerated,
}: GenerateRouteModalProps) {
  const today = new Date().toISOString().split('T')[0] ?? '';
  const [wardId, setWardId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [routeDate, setRouteDate] = useState(today);
  const [wasteType, setWasteType] = useState<WasteType>('ORGANIC');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const generateMutation = useGenerateRoute();

  const { data: wards = [], isLoading: isLoadingWards } = useAdminWards();
  const { data: fleetData, isLoading: isLoadingFleet } = useVehicles({ status: 'AVAILABLE', pageSize: 100 });
  const { data: drivers = [], isLoading: isLoadingDrivers } = useEligibleDrivers();

  const availableVehicles = fleetData?.vehicles || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parseResult = generateDailyRouteSchema.safeParse({
      wardId,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      routeDate,
      wasteType,
      notes: notes || null,
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.errors[0]?.message || 'Please check input parameters');
      return;
    }

    startTransition(async () => {
      try {
        const res = await generateMutation.mutateAsync(parseResult.data);
        onOpenChange(false);
        if (res.data?.id) {
          onGenerated?.(res.data.id);
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'details' in err && err.details && typeof err.details === 'object') {
          const detailsObj = err.details as Record<string, unknown>;
          const messages = Object.values(detailsObj)
            .flatMap((v) => (Array.isArray(v) ? v : [String(v)]))
            .filter(Boolean);
          setErrorMessage(messages.join('. ') || (err instanceof Error ? err.message : 'Failed to generate route manifest'));
        } else {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to generate route manifest');
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-xl shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <RouteIcon className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Generate Route Manifest
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13.5px] text-slate-500">
            Automatically aggregates verified premises and approved bulky pickups into an optimized collection route.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-[13px] text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-slate-700">
              Target Ward <span className="text-rose-500">*</span>
            </label>
            <select
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              disabled={isLoadingWards}
              required
              className="w-full h-10 px-3 text-[14px] border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Select Municipal Ward...</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  Ward No. {w.wardNumber} {w.officeAddress ? `(${w.officeAddress})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Waste Stream</label>
              <select
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value as WasteType)}
                className="w-full h-10 px-3 text-[14px] border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ORGANIC">Organic Waste</option>
                <option value="RECYCLABLE">Recyclable Stream</option>
                <option value="HAZARDOUS">Hazardous / Special</option>
                <option value="BULKY">Bulky Pickups</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Collection Date</label>
              <Input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                required
                className="h-10 text-[14px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-slate-700">Assign Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={isLoadingFleet}
              className="w-full h-10 px-3 text-[14px] border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Assign Later (Unassigned)</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo} - {v.vehicleType} ({(v.capacityKg / 1000).toFixed(1)} MT)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-slate-700">Assign Driver</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              disabled={isLoadingDrivers}
              className="w-full h-10 px-3 text-[14px] border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Assign Later (Unassigned)</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.phone})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 text-[14px] border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 text-[14px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Stops...
                </>
              ) : (
                'Generate Route'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

