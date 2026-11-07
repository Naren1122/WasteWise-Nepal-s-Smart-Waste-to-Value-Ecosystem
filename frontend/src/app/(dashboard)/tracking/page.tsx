'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useLiveTracking } from '@/features/tracking/hooks/useLiveTracking';
import { LiveOperationsMap } from '@/features/tracking/components/LiveOperationsMap';
import { VehicleTrackingCard } from '@/features/tracking/components/VehicleTrackingCard';
import { CitizenApproachingAlert } from '@/features/tracking/components/CitizenApproachingAlert';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Truck,
  Search,
  RefreshCw,
  Radio,
  Navigation,
  CheckCircle2,
  Wrench,
  Play,
} from 'lucide-react';

export default function LiveTrackingPage() {
  const {
    vehicles,
    isLoading,
    isConnected,
    isSimulating,
    simulateMovement,
    selectedVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    breadcrumbs,
    refetch,
  } = useLiveTracking();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON_ROUTE' | 'AVAILABLE' | 'MAINTENANCE'>('ALL');
  const [, startTransition] = useTransition();

  // Filter fleet based on debounced search and active status tab
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        !debouncedSearch ||
        v.registrationNo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (v.driverName && v.driverName.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ON_ROUTE' && v.status === 'ON_ROUTE') ||
        (statusFilter === 'MAINTENANCE' && v.status === 'MAINTENANCE') ||
        (statusFilter === 'AVAILABLE' && (v.status === 'AVAILABLE' || v.status === 'IDLE'));

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, debouncedSearch, statusFilter]);

  const onRouteTrucks = useMemo(() => vehicles.filter((v) => v.status === 'ON_ROUTE'), [vehicles]);
  const activeApproachingTruck = onRouteTrucks[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PageHeader
        title="Live Fleet & GPS Operations"
        actions={
          <div className="flex items-center gap-2.5">
            <Badge
              className={`h-9 px-3 gap-1.5 text-[12px] font-semibold border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse text-emerald-600' : 'text-amber-500'}`} />
              <span>{isConnected ? 'Live Telemetry' : 'Connecting Stream...'}</span>
            </Badge>

            <Button
              onClick={simulateMovement}
              disabled={isSimulating || vehicles.length === 0}
              className="h-9 px-3.5 text-[13px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-lg inline-flex items-center gap-1.5"
              title="Stream simulated GPS telemetry through Kathmandu streets"
            >
              <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Simulating Run...' : 'Simulate Live Run'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-9 px-3 text-[13px] rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1.5">Refresh</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-3.5 sm:p-5 lg:p-6 space-y-4 max-w-7xl mx-auto w-full">
        {/* Citizen "Approaching Vehicle" Proximity Banner */}
        <CitizenApproachingAlert
          activeVehicle={activeApproachingTruck}
          onFocus={(id) => setSelectedVehicleId(id)}
        />

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-slate-500 uppercase">Tracked Fleet</span>
              <Truck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{vehicles.length}</div>
            <span className="text-[11px] text-slate-400">Total assets</span>
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-emerald-600 uppercase">On Route</span>
              <Navigation className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">{onRouteTrucks.length}</div>
            <span className="text-[11px] text-emerald-600/80">Streaming live GPS</span>
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-slate-600 uppercase">Available</span>
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
              {vehicles.filter((v) => v.status === 'AVAILABLE' || v.status === 'IDLE').length}
            </div>
            <span className="text-[11px] text-slate-400">Stationed at hub</span>
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-amber-600 uppercase">Workshop</span>
              <Wrench className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">
              {vehicles.filter((v) => v.status === 'MAINTENANCE').length}
            </div>
            <span className="text-[11px] text-amber-600/80">Under repair</span>
          </Card>
        </div>

        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by license plate or driver name..."
              value={search}
              onChange={(e) => startTransition(() => setSearch(e.target.value))}
              className="pl-9 h-10 text-[13.5px] rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'ON_ROUTE', 'AVAILABLE', 'MAINTENANCE'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => startTransition(() => setStatusFilter(status))}
                className={`h-9 px-3 text-[12.5px] rounded-lg font-medium whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Responsive Map & Vehicle Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Live Map Canvas */}
          <div className="lg:col-span-8 h-[450px] sm:h-[540px] lg:h-[620px]">
            <LiveOperationsMap
              vehicles={filteredVehicles}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={(id) => setSelectedVehicleId(id)}
              breadcrumbs={breadcrumbs}
            />
          </div>

          {/* Active Fleet List Sidebar */}
          <div className="lg:col-span-4 space-y-2.5 max-h-[500px] lg:max-h-[620px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] font-bold text-slate-800">
                Fleet Feed ({filteredVehicles.length})
              </span>
              {selectedVehicle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVehicleId(null)}
                  className="h-6 text-[11px] text-slate-400 hover:text-slate-700"
                >
                  Clear Selection
                </Button>
              )}
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-[13px]">
                No vehicles matching filter.
              </div>
            ) : (
              filteredVehicles.map((v) => (
                <VehicleTrackingCard
                  key={v.vehicleId}
                  vehicle={v}
                  isSelected={v.vehicleId === selectedVehicleId}
                  onSelect={(id) => setSelectedVehicleId(id)}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

