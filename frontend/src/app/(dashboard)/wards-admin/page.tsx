'use client';

import React, { useState, useTransition } from 'react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  useAdminWards,
  useAdminZones,
  WardAdminItem,
  ZoneAdminItem,
} from '@/features/wards/hooks/useWardsAdmin';
import { CreateZoneForm } from '@/features/wards/components/CreateZoneForm';
import { CreateWardDialog } from '@/features/wards/components/CreateWardDialog';
import {
  Building2,
  MapPin,
  Plus,
  RefreshCw,
  ChevronLeft,
  Phone,
  Layers,
} from 'lucide-react';

export default function WardsAdminPage() {
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [showCreateZone, setShowCreateZone] = useState<boolean>(false);
  const [isAddWardOpen, setIsAddWardOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const { data: wards, isLoading: loadingWards, refetch: refetchWards, isRefetching } = useAdminWards();

  const activeWardId = selectedWardId || (wards && wards.length > 0 ? wards[0]?.id ?? null : null);
  const activeWard = wards?.find((w) => w.id === activeWardId);

  const { data: zones, isLoading: loadingZones, refetch: refetchZones } = useAdminZones(activeWardId);

  const handleSelectWard = (id: string) => {
    startTransition(() => {
      setSelectedWardId(id);
      setShowCreateZone(false);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Standardized Reusable Page Header */}
      <PageHeader
        title="Wards & Service Zones"
        badge={
          activeWard ? (
            <Badge variant="active" className="hidden sm:inline-flex ml-1">
              Ward No. {activeWard.wardNumber}
            </Badge>
          ) : undefined
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                refetchWards();
                refetchZones();
              }}
              disabled={loadingWards || isRefetching}
              className="h-10 px-3.5 text-[14px] rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Refresh wards"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => setShowCreateZone((prev) => !prev)}
              className="h-10 px-4 text-[14px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2"
            >
              {showCreateZone ? (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Zones</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Service Zone</span>
                  <span className="sm:hidden">Add Zone</span>
                </>
              )}
            </Button>
          </>
        }
      />

      {/* 2. Main Work Area: Full Responsive Width */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* Left Column: Municipal Wards Selector */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                Municipal Wards ({wards?.length ?? 0})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddWardOpen(true)}
                className="h-8 px-2.5 text-[13px] font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Ward</span>
              </Button>
            </div>

            {loadingWards && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!loadingWards && wards && wards.length > 0 && (
              <div className="space-y-3">
                {wards.map((ward: WardAdminItem) => {
                  const isSelected = ward.id === activeWardId;
                  return (
                    <div
                      key={ward.id}
                      onClick={() => handleSelectWard(ward.id)}
                      className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/60 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                          : 'bg-white border-slate-300 hover:border-slate-400 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base sm:text-[17px] text-slate-900 flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                          Ward No. {ward.wardNumber}
                        </span>
                        <Badge variant={isSelected ? 'active' : 'outline'}>
                          {ward._count?.serviceZones ?? 0} Zones
                        </Badge>
                      </div>

                      {ward.officeAddress && (
                        <p className="text-[13.5px] text-slate-600 flex items-center gap-1.5 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{ward.officeAddress}</span>
                        </p>
                      )}

                      {ward.contactPhone && (
                        <p className="text-[12.5px] text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ward.contactPhone}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Zones Table OR Create Zone Form */}
          <div className="lg:col-span-8 xl:col-span-8">
            {showCreateZone && activeWard ? (
              <CreateZoneForm
                wardId={activeWard.id}
                wardNumber={activeWard.wardNumber}
                onSuccess={() => setShowCreateZone(false)}
                onCancel={() => setShowCreateZone(false)}
              />
            ) : (
              <div className="bg-white border border-slate-300 rounded-xl shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      Ward No. {activeWard?.wardNumber} Collection Zones
                    </h3>
                    <p className="text-[14px] text-slate-500 mt-0.5">
                      Collection routes and scheduled waste pickup areas
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateZone(true)}
                    className="h-10 px-4 text-[14px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Zone</span>
                  </Button>
                </div>

                {loadingZones && (
                  <div className="space-y-3 py-4">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                )}

                {!loadingZones && zones && zones.length === 0 && (
                  <div className="py-14 text-center max-w-md mx-auto">
                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                      <Layers className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg">No service zones created yet</h4>
                    <p className="text-[14px] text-slate-500 mt-1.5 mb-5 leading-relaxed">
                      Create collection zones to divide Ward No. {activeWard?.wardNumber} into manageable pickup routes and toles.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateZone(true)}
                      className="h-10 px-5 text-[14px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First Zone</span>
                    </Button>
                  </div>
                )}

                {!loadingZones && zones && zones.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-1">
                    {zones.map((zone: ZoneAdminItem) => (
                      <Card
                        key={zone.id}
                        className="p-5 bg-white border border-slate-300 rounded-xl hover:border-slate-400 transition-all shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-[16px] text-slate-900 truncate">
                              {zone.name}
                            </span>
                            <Badge variant="active" className="text-[11.5px] font-mono">
                              {zone.code}
                            </Badge>
                          </div>
                          {zone.description && (
                            <p className="text-[13.5px] text-slate-500 line-clamp-2 mt-1">
                              {zone.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[12.5px] text-slate-500">
                          <span>{zone._count?.properties ?? 0} Registered Premises</span>
                          <span className="text-emerald-700 font-semibold">Active Zone</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Modal to Register a New Municipal Ward */}
      <CreateWardDialog
        open={isAddWardOpen}
        onOpenChange={setIsAddWardOpen}
        onCreated={(id) => handleSelectWard(id)}
      />
    </div>
  );
}
