import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Truck, CheckCircle2, Navigation, Wrench } from 'lucide-react';

interface FleetKpiCardsProps {
  totalCount: number;
  availableCount: number;
  onRouteCount: number;
  maintenanceCount: number;
}

export function FleetKpiCards({
  totalCount,
  availableCount,
  onRouteCount,
  maintenanceCount,
}: FleetKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Fleet</span>
          <Truck className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
        <span className="text-[11.5px] text-slate-400">Registered assets</span>
      </Card>

      <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Available</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-emerald-700 mt-1">{availableCount}</div>
        <span className="text-[11.5px] text-emerald-600/80">Ready for dispatch</span>
      </Card>

      <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-600 uppercase">On Route</span>
          <Navigation className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-blue-700 mt-1">{onRouteCount}</div>
        <span className="text-[11.5px] text-blue-600/80">Active collection</span>
      </Card>

      <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-600 uppercase">Maintenance</span>
          <Wrench className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-amber-700 mt-1">{maintenanceCount}</div>
        <span className="text-[11.5px] text-amber-600/80">Under workshop review</span>
      </Card>
    </div>
  );
}

