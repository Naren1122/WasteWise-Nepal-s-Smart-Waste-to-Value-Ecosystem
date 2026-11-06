'use client';

import React, { useState, useTransition } from 'react';
import { useCreateVehicle, useEligibleDrivers } from '../hooks/useFleet';
import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  createVehicleSchema,
  type VehicleType,
  type FuelType,
} from '../types/fleet.types';
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
import { Truck, AlertCircle, Loader2 } from 'lucide-react';

interface RegisterVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered?: (vehicleId: string) => void;
}

export function RegisterVehicleModal({
  open,
  onOpenChange,
  onRegistered,
}: RegisterVehicleModalProps) {
  const [registrationNo, setRegistrationNo] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('COMPACTOR');
  const [capacityKg, setCapacityKg] = useState('5000');
  const [fuelType, setFuelType] = useState<FuelType>('DIESEL');
  const [assignedDriverId, setAssignedDriverId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const createVehicleMutation = useCreateVehicle();
  const { data: eligibleDrivers = [], isLoading: isLoadingDrivers } = useEligibleDrivers();

  const resetForm = () => {
    setRegistrationNo('');
    setVehicleType('COMPACTOR');
    setCapacityKg('5000');
    setFuelType('DIESEL');
    setAssignedDriverId('');
    setNotes('');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parseResult = createVehicleSchema.safeParse({
      registrationNo,
      vehicleType,
      capacityKg: parseFloat(capacityKg),
      fuelType,
      assignedDriverId: assignedDriverId || null,
      notes: notes || null,
    });

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid vehicle details';
      setErrorMessage(firstError);
      return;
    }

    startTransition(async () => {
      try {
        const res = await createVehicleMutation.mutateAsync(parseResult.data);
        resetForm();
        onOpenChange(false);
        if (res.data?.id) {
          onRegistered?.(res.data.id);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to register vehicle');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-xl shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Register Fleet Vehicle
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13.5px] text-slate-500">
            Add a collection vehicle to the municipal waste fleet roster.
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
              Registration Number <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. BA-1-KHA-4029"
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value.toUpperCase())}
              required
              className="h-10 text-[14px] uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full h-10 px-3 text-[14px] border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Fuel Stream</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full h-10 px-3 text-[14px] border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-slate-700">
                Payload Capacity (kg) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[12px] font-medium text-emerald-700">
                {(parseFloat(capacityKg || '0') / 1000).toFixed(1)} Metric Tons
              </span>
            </div>
            <Input
              type="number"
              min="100"
              max="50000"
              step="50"
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value)}
              required
              className="h-10 text-[14px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-slate-700">
              Assign Primary Driver <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              value={assignedDriverId}
              onChange={(e) => setAssignedDriverId(e.target.value)}
              disabled={isLoadingDrivers}
              className="w-full h-10 px-3 text-[14px] border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Unassigned (Reserve Fleet)</option>
              {eligibleDrivers.map((d) => (
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
                  Saving...
                </>
              ) : (
                'Register Vehicle'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
