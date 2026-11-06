'use client';

import React, { useOptimistic, useTransition } from 'react';
import type { Vehicle, VehicleStatus } from '../types/fleet.types';
import { useUpdateVehicle } from '../hooks/useFleet';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/shared/components/ui/table';
import { Truck, User, Fuel, Wrench, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface FleetTableProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

function getStatusBadge(status: VehicleStatus) {
  switch (status) {
    case 'AVAILABLE':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">AVAILABLE</Badge>;
    case 'ON_ROUTE':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">ON ROUTE</Badge>;
    case 'MAINTENANCE':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">MAINTENANCE</Badge>;
    case 'RETIRED':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-300">RETIRED</Badge>;
  }
}

export function FleetTable({ vehicles, isLoading }: FleetTableProps) {
  const [, startTransition] = useTransition();
  const updateMutation = useUpdateVehicle();

  // React 19 optimistic updates for quick status toggles
  const [optimisticVehicles, setOptimisticVehicles] = useOptimistic(
    vehicles,
    (state, update: { id: string; status: VehicleStatus }) =>
      state.map((v) => (v.id === update.id ? { ...v, status: update.status } : v))
  );

  const handleToggleStatus = (vehicle: Vehicle, nextStatus: VehicleStatus) => {
    startTransition(async () => {
      setOptimisticVehicles({ id: vehicle.id, status: nextStatus });
      try {
        await updateMutation.mutateAsync({ id: vehicle.id, data: { status: nextStatus } });
      } catch {
        // Reverts automatically on error
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading municipal fleet...</p>
      </div>
    );
  }

  if (optimisticVehicles.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
        <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Fleet Vehicles Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          No vehicles match the selected criteria or none have been registered yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Desktop / Tablet Table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
              <TableHead className="font-semibold text-slate-700">Vehicle / Plate</TableHead>
              <TableHead className="font-semibold text-slate-700">Type & Fuel</TableHead>
              <TableHead className="font-semibold text-slate-700">Payload Capacity</TableHead>
              <TableHead className="font-semibold text-slate-700">Assigned Driver</TableHead>
              <TableHead className="font-semibold text-slate-700">Operational Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {optimisticVehicles.map((vehicle) => (
              <TableRow key={vehicle.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[14px] text-slate-900 block tracking-tight">
                        {vehicle.registrationNo}
                      </span>
                      <span className="text-[11.5px] text-slate-500 font-medium">
                        Routes run: {vehicle.routesCount ?? 0}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[13px] font-semibold text-slate-800 block">
                    {vehicle.vehicleType.replace('_', ' ')}
                  </span>
                  <span className="text-[11.5px] text-slate-500 inline-flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-slate-400" />
                    {vehicle.fuelType || 'Unspecified'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[13px] font-bold text-slate-800 block">
                    {(vehicle.capacityKg / 1000).toFixed(1)} MT
                  </span>
                  <span className="text-[11.5px] text-slate-500">
                    {vehicle.capacityKg.toLocaleString()} kg
                  </span>
                </TableCell>
                <TableCell>
                  {vehicle.assignedDriver ? (
                    <div>
                      <span className="text-[13px] font-medium text-slate-900 block">
                        {vehicle.assignedDriver.fullName}
                      </span>
                      <span className="text-[11.5px] text-slate-500">
                        {vehicle.assignedDriver.phone}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[12px] text-slate-400 italic">Unassigned (Pool)</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 justify-end">
                    {vehicle.status === 'AVAILABLE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Mark for maintenance"
                        onClick={() => handleToggleStatus(vehicle, 'MAINTENANCE')}
                        className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                      >
                        <Wrench className="w-3.5 h-3.5 mr-1" />
                        Service
                      </Button>
                    )}
                    {vehicle.status === 'MAINTENANCE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Mark as available"
                        onClick={() => handleToggleStatus(vehicle, 'AVAILABLE')}
                        className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Stacked Cards (< 640px) */}
      <div className="sm:hidden divide-y divide-slate-100">
        {optimisticVehicles.map((vehicle) => (
          <div key={vehicle.id} className="p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[15px] text-slate-900">{vehicle.registrationNo}</span>
              {getStatusBadge(vehicle.status)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <div>
                <span className="text-slate-500 block text-xs">Type</span>
                <span className="font-semibold text-slate-800">{vehicle.vehicleType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Capacity</span>
                <span className="font-semibold text-slate-800">
                  {(vehicle.capacityKg / 1000).toFixed(1)} MT
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {vehicle.assignedDriver?.fullName || 'Unassigned'}
              </span>
              {vehicle.status === 'AVAILABLE' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(vehicle, 'MAINTENANCE')}
                  className="h-8 text-xs text-amber-700"
                >
                  Mark Service
                </Button>
              ) : vehicle.status === 'MAINTENANCE' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(vehicle, 'AVAILABLE')}
                  className="h-8 text-xs text-emerald-700"
                >
                  Mark Active
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

