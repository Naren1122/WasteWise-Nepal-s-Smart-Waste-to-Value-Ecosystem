'use client';

import React, { useState, useTransition } from 'react';
import { useAdminProperties, useUpdatePropertyStatus } from '../hooks/useAdminProperties';
import { Property, PropertyStatus, useWards } from '../hooks/useProperties';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import {
  Building2,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export function AdminPropertyVerificationQueue() {
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'ALL'>('PENDING_VERIFICATION');
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  const { data: wards } = useWards();
  const {
    data: result,
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useAdminProperties({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    wardId: selectedWardId === 'ALL' ? undefined : selectedWardId,
  });

  const updateStatusMutation = useUpdatePropertyStatus();

  const handleStatusChange = (propertyId: string, newStatus: PropertyStatus) => {
    updateStatusMutation.mutate({
      propertyId,
      status: newStatus,
    });
  };

  const properties = result?.data || [];

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-150">
      {/* 1. Filter Control Bar */}
      <Card className="p-3 sm:p-4 bg-white border border-slate-300 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'ALL'] as const).map((st) => {
            const isActive = statusFilter === st;
            const label =
              st === 'PENDING_VERIFICATION'
                ? 'Pending Review'
                : st === 'ACTIVE'
                ? 'Verified'
                : st === 'INACTIVE'
                ? 'Inactive'
                : 'All Premises';

            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`h-8 px-3 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Ward Filter & Refresh */}
        <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
          <div className="w-full md:w-44">
            <Select
              value={selectedWardId}
              onValueChange={(val) => setSelectedWardId(val)}
            >
              <SelectTrigger className="h-9 text-[13.5px]">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Municipal Wards</SelectItem>
                {wards?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    Ward No. {w.wardNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 px-2.5 text-[13px] shrink-0"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </Card>

      {/* 2. Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 3. Error State */}
      {isError && (
        <Card className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-[15px] font-semibold text-rose-800">Failed to load premises queue</h4>
          <p className="text-[13px] text-rose-600 mt-0.5">
            {error instanceof Error ? error.message : 'Please check permissions or network connectivity.'}
          </p>
        </Card>
      )}

      {/* 4. Empty State */}
      {!isLoading && !isError && properties.length === 0 && (
        <Card className="p-10 bg-white border border-slate-200/80 rounded-xl text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-[16px] font-bold text-slate-900">Verification Queue Clear</h4>
          <p className="text-[14px] text-slate-500 mt-1">
            No premises matching the selected status or ward filter require verification.
          </p>
        </Card>
      )}

      {/* 5. Premises Queue Items */}
      {!isLoading && !isError && properties.length > 0 && (
        <div className="space-y-3">
          {properties.map((prop) => (
            <Card
              key={prop.id}
              className="p-4 sm:p-5 bg-white border border-slate-300 rounded-xl shadow-xs hover:border-slate-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Premises Metadata */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      prop.status === 'ACTIVE'
                        ? 'active'
                        : prop.status === 'PENDING_VERIFICATION'
                        ? 'pending'
                        : 'inactive'
                    }
                  >
                    {prop.status === 'ACTIVE'
                      ? 'Verified'
                      : prop.status === 'PENDING_VERIFICATION'
                      ? 'Pending Review'
                      : 'Inactive'}
                  </Badge>
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                    {prop.propertyType}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[13px] font-medium text-emerald-700">
                    Ward {prop.wardNumber ?? '—'}
                  </span>
                  {prop.zoneName && (
                    <span className="text-[13px] text-slate-500">({prop.zoneName})</span>
                  )}
                </div>

                <h4 className="text-[15px] sm:text-[16px] font-bold text-slate-900 truncate">
                  {prop.houseNumber ? `House #${prop.houseNumber}, ` : ''}
                  {prop.streetAddress}
                </h4>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-500 pt-0.5">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {prop.contactName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {prop.contactPhone}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {prop.latitude.toFixed(4)}, {prop.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Municipal Staff */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                {prop.status !== 'ACTIVE' && (
                  <Button
                    onClick={() => handleStatusChange(prop.id, 'ACTIVE')}
                    disabled={updateStatusMutation.isPending}
                    className="h-9 px-3.5 text-[13px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Activate</span>
                  </Button>
                )}

                {prop.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange(prop.id, 'INACTIVE')}
                    disabled={updateStatusMutation.isPending}
                    className="h-9 px-3 text-[13px] font-medium text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Deactivate</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

