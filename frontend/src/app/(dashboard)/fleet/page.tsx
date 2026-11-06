'use client';

import React, { useState, useTransition } from 'react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { useVehicles } from '@/features/fleet/hooks/useFleet';
import { FleetTable } from '@/features/fleet/components/FleetTable';
import { RegisterVehicleModal } from '@/features/fleet/components/RegisterVehicleModal';
import { useRoutes } from '@/features/routes/hooks/useRoutes';
import { DispatchRoutesList } from '@/features/routes/components/DispatchRoutesList';
import { GenerateRouteModal } from '@/features/routes/components/GenerateRouteModal';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { VehicleStatus, VehicleType } from '@/features/fleet/types/fleet.types';
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Navigation,
  Wrench,
  Route as RouteIcon,
} from 'lucide-react';

export default function FleetManagementPage() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'routes'>('fleet');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isGenerateRouteOpen, setIsGenerateRouteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'ALL'>('ALL');
  const [, startTransition] = useTransition();

  const { data: fleetData, isLoading: isLoadingFleet, refetch: refetchFleet, isRefetching: isRefetchingFleet } = useVehicles({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    vehicleType: typeFilter !== 'ALL' ? typeFilter : undefined,
    pageSize: 50,
  });

  const { data: routesData, isLoading: isLoadingRoutes, refetch: refetchRoutes, isRefetching: isRefetchingRoutes } = useRoutes({
    pageSize: 50,
  });

  const vehicles = fleetData?.vehicles || [];
  const routes = routesData?.routes || [];
  const availableCount = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const onRouteCount = vehicles.filter((v) => v.status === 'ON_ROUTE').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PageHeader
        title="Fleet & Route Control"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                refetchFleet();
                refetchRoutes();
              }}
              disabled={isLoadingFleet || isRefetchingFleet || isLoadingRoutes || isRefetchingRoutes}
              className="h-10 px-3.5 text-[14px] rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetchingFleet || isRefetchingRoutes ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {activeTab === 'fleet' ? (
              <Button
                onClick={() => setIsRegisterOpen(true)}
                className="h-10 px-4 text-[14px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register Vehicle</span>
              </Button>
            ) : (
              <Button
                onClick={() => setIsGenerateRouteOpen(true)}
                className="h-10 px-4 text-[14px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Route</span>
              </Button>
            )}
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Fleet KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Fleet</span>
              <Truck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{vehicles.length}</div>
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

        {/* Workspace Mode Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'fleet' | 'routes')} className="w-full">
          <TabsList className="bg-slate-200/80 p-1 rounded-xl h-11">
            <TabsTrigger
              value="fleet"
              className="rounded-lg text-[13.5px] font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Vehicles & Assets ({vehicles.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="routes"
              className="rounded-lg text-[13.5px] font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 gap-2"
            >
              <RouteIcon className="w-4 h-4" />
              <span>Dispatched Routes ({routes.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by vehicle plate or driver name..."
                  value={search}
                  onChange={(e) => startTransition(() => setSearch(e.target.value))}
                  className="pl-9 h-10 text-[14px]"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => startTransition(() => setStatusFilter(e.target.value as VehicleStatus | 'ALL'))}
                  className="h-10 px-3 text-[13.5px] border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ON_ROUTE">On Route</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => startTransition(() => setTypeFilter(e.target.value as VehicleType | 'ALL'))}
                  className="h-10 px-3 text-[13.5px] border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">All Types</option>
                  <option value="COMPACTOR">Compactor</option>
                  <option value="TIPPER">Tipper</option>
                  <option value="TRUCK">Truck</option>
                  <option value="TRACTOR">Tractor</option>
                  <option value="ELECTRIC_CART">Electric Cart</option>
                </select>
              </div>
            </div>

            <FleetTable vehicles={vehicles} isLoading={isLoadingFleet} />
          </TabsContent>

          <TabsContent value="routes" className="space-y-4 pt-4">
            <DispatchRoutesList routes={routes} isLoading={isLoadingRoutes} />
          </TabsContent>
        </Tabs>
      </main>

      <RegisterVehicleModal
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        onRegistered={() => refetchFleet()}
      />

      <GenerateRouteModal
        open={isGenerateRouteOpen}
        onOpenChange={setIsGenerateRouteOpen}
        onGenerated={() => refetchRoutes()}
      />
    </div>
  );
}
