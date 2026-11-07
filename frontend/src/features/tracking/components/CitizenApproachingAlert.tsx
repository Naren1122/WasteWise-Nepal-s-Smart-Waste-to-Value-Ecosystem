'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Truck, Navigation, Sparkles } from 'lucide-react';
import type { LiveVehicleState } from '../types/tracking.types';

interface CitizenApproachingAlertProps {
  activeVehicle?: LiveVehicleState;
  onFocus: (vehicleId: string) => void;
}

export function CitizenApproachingAlert({
  activeVehicle,
  onFocus,
}: CitizenApproachingAlertProps) {
  if (!activeVehicle || activeVehicle.status !== 'ON_ROUTE') {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md border-0 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-40" />
            <div className="relative p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight flex items-center gap-1.5">
                Collection Truck Approaching
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10.5px] uppercase font-semibold">
                Live Run
              </Badge>
            </div>
            <p className="text-[12.5px] text-slate-300 mt-0.5">
              Truck <b className="text-white">{activeVehicle.registrationNo}</b> is collecting in your ward ({activeVehicle.wasteType || 'Scheduled'} Waste).
            </p>
          </div>
        </div>

        <Button
          onClick={() => onFocus(activeVehicle.vehicleId)}
          className="w-full sm:w-auto h-10 px-4 text-[13.5px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-xs inline-flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          <span>Track on Live Map</span>
        </Button>
      </div>
    </Card>
  );
}

