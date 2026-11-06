'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useWards } from '@/features/properties/hooks/useProperties';
import {
  useCollectionSchedules,
  useServicePlans,
  useBulkyWasteRequests,
} from '@/features/schedules/hooks/useSchedules';
import { ScheduleTimetable } from '@/features/schedules/components/ScheduleTimetable';
import { BulkyWasteTable } from '@/features/schedules/components/BulkyWasteTable';
import { ServicePlansList } from '@/features/schedules/components/ServicePlansList';
import { BookBulkyPickupDialog } from '@/features/schedules/components/BookBulkyPickupDialog';
import { Plus, RefreshCw, Calendar, PackageOpen, Layers } from 'lucide-react';

export default function SchedulesPage() {
  const { tenantSubdomain } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'TIMETABLE' | 'BULKY_WASTE' | 'PLANS'>('TIMETABLE');
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const { data: wards } = useWards();
  const {
    data: schedules,
    isLoading: loadingSchedules,
    refetch: refetchSchedules,
    isRefetching: refetchingSchedules,
  } = useCollectionSchedules(selectedWardId);

  const {
    data: bulkyRequests,
    isLoading: loadingBulky,
    refetch: refetchBulky,
  } = useBulkyWasteRequests({ wardId: selectedWardId });

  const {
    data: servicePlans,
    isLoading: loadingPlans,
    refetch: refetchPlans,
  } = useServicePlans();

  const handleRefresh = () => {
    if (activeTab === 'TIMETABLE') refetchSchedules();
    else if (activeTab === 'BULKY_WASTE') refetchBulky();
    else refetchPlans();
  };

  const pendingBulkyCount = bulkyRequests?.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'QUOTED'
  ).length ?? 0;

  const selectedWardObj = wards?.find((w) => w.id === selectedWardId);
  const selectedWardNumber = selectedWardObj ? selectedWardObj.wardNumber : null;
  const municipalityName = tenantSubdomain?.toUpperCase() || 'LALITPUR / KATHMANDU';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Header with Tenant Badge and Quick Actions */}
      <PageHeader
        title="Collection Schedules & Services"
        badge={
          <div className="hidden sm:flex items-center gap-2 ml-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{municipalityName}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase hidden md:inline">
              PHASE 3: SCHEDULING & CATALOG
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refetchingSchedules}
              className="h-9 sm:h-10 px-2.5 sm:px-3.5 text-[13px] sm:text-[13.5px] rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refetchingSchedules ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => setIsBookModalOpen(true)}
              className="h-9 sm:h-10 px-3 sm:px-4 text-[13px] sm:text-[13.5px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Request Bulky Pickup</span>
              <span className="sm:hidden">Request</span>
            </Button>
          </div>
        }
      />

      {/* 2. Top Navigation Tabs & Ward Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Segmented Tabs (Scrollable on Mobile) */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('TIMETABLE')}
              className={`pb-3 px-2 sm:px-3 text-[13px] sm:text-[13.5px] font-bold transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
                activeTab === 'TIMETABLE'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-emerald-700" />
              <span className="hidden sm:inline">Recurring Ward Schedule</span>
              <span className="sm:hidden">Ward Schedule</span>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                7 DAYS
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BULKY_WASTE')}
              className={`pb-3 px-2 sm:px-3 text-[13px] sm:text-[13.5px] font-bold transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
                activeTab === 'BULKY_WASTE'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PackageOpen className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Bulky Waste Requests</span>
              <span className="sm:hidden">Bulky Requests</span>
              {pendingBulkyCount > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                  {pendingBulkyCount} PENDING
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600">
                  {bulkyRequests?.length ?? 0}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PLANS')}
              className={`pb-3 px-2 sm:px-3 text-[13px] sm:text-[13.5px] font-bold transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
                activeTab === 'PLANS'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Service Plans & Tariffs</span>
              <span className="sm:hidden">Service Plans</span>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {servicePlans?.length ?? 0}
              </span>
            </button>
          </div>

          {/* Ward Quick Selector Filter */}
          {activeTab !== 'PLANS' && (
            <div className="pb-2 flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                WARD:
              </span>
              <Select value={selectedWardId} onValueChange={setSelectedWardId}>
                <SelectTrigger className="h-9 w-full sm:w-[200px] border-slate-200 rounded-lg text-[13px] bg-slate-50 font-semibold text-slate-800">
                  <SelectValue placeholder="All Wards (Active Grid)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Wards (Active Grid)</SelectItem>
                  {wards?.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      Ward No. {ward.wardNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-5">
        {activeTab === 'TIMETABLE' && (
          <ScheduleTimetable
            schedules={schedules || []}
            isLoading={loadingSchedules}
            selectedWardNumber={selectedWardNumber}
            selectedWardId={selectedWardId}
          />
        )}

        {activeTab === 'BULKY_WASTE' && (
          <BulkyWasteTable
            requests={bulkyRequests || []}
            isLoading={loadingBulky}
          />
        )}

        {activeTab === 'PLANS' && (
          <ServicePlansList
            plans={servicePlans || []}
            isLoading={loadingPlans}
          />
        )}
      </main>

      {/* 4. Book Bulky Waste Modal */}
      <BookBulkyPickupDialog
        open={isBookModalOpen}
        onOpenChange={setIsBookModalOpen}
      />
    </div>
  );
}
