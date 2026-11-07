'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Truck, Navigation, Gauge, Clock, User } from 'lucide-react';
import type { LiveVehicleState } from '../types/tracking.types';

interface VehicleTrackingCardProps {
  vehicle: LiveVehicleState;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function VehicleTrackingCard({
  vehicle,
  isSelected,
  onSelect,
}: VehicleTrackingCardProps) {
  const isOnRoute = vehicle.status === 'ON_ROUTE';

  return (
    <Card
      onClick={() => onSelect(vehicle.vehicleId)}
      className={`p-3.5 sm:p-4 cursor-pointer transition-all duration-200 border rounded-xl ${
        isSelected
          ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20 shadow-md'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              isOnRoute
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Truck className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-[14.5px] text-slate-900 block tracking-tight">
              {vehicle.registrationNo}
            </span>
            <span className="text-[12px] text-slate-500 font-medium inline-flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              {vehicle.driverName || 'Unassigned'}
            </span>
          </div>
        </div>

        {isOnRoute ? (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5">
            ON ROUTE
          </Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5">
            {vehicle.status}
          </Badge>
        )}
      </div>

      {isOnRoute && (
        <div className="mt-3 pt-2.5 border-t border-slate-100/90 grid grid-cols-2 gap-2 text-[12px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Speed: <strong className="text-slate-800 font-semibold">{vehicle.speedKmh.toFixed(0)} km/h</strong></span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Heading: <strong className="text-slate-800 font-semibold">{vehicle.headingDeg}°</strong></span>
          </div>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-300" />
          {vehicle.lastHeartbeat
            ? new Date(vehicle.lastHeartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'No GPS stream'}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(vehicle.vehicleId);
          }}
          className="h-7 px-2.5 text-[11.5px] rounded-md border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
        >
          {isSelected ? 'Focused' : 'View on Map'}
        </Button>
      </div>
    </Card>
  );
}

