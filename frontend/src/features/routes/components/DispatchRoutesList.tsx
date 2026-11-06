'use client';

import React, { useOptimistic, useTransition } from 'react';
import type { Route, RouteStatus } from '../types/routes.types';
import { useUpdateRouteStatus } from '../hooks/useRoutes';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import {
  Route as RouteIcon,
  Truck,
  User,
  Calendar,
  Send,
  Play,
  CheckCircle2,
} from 'lucide-react';

interface DispatchRoutesListProps {
  routes: Route[];
  isLoading: boolean;
}

function getRouteStatusBadge(status: RouteStatus) {
  switch (status) {
    case 'DRAFT':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-300">DRAFT</Badge>;
    case 'DISPATCHED':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">DISPATCHED</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">IN PROGRESS</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">COMPLETED</Badge>;
    case 'CANCELLED':
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200">CANCELLED</Badge>;
  }
}

export function DispatchRoutesList({ routes, isLoading }: DispatchRoutesListProps) {
  const [, startTransition] = useTransition();
  const updateStatusMutation = useUpdateRouteStatus();

  const [optimisticRoutes, setOptimisticRoutes] = useOptimistic(
    routes,
    (state, update: { id: string; status: RouteStatus }) =>
      state.map((r) => (r.id === update.id ? { ...r, status: update.status } : r))
  );

  const handleUpdateStatus = (route: Route, nextStatus: RouteStatus) => {
    startTransition(async () => {
      setOptimisticRoutes({ id: route.id, status: nextStatus });
      try {
        await updateStatusMutation.mutateAsync({ id: route.id, data: { status: nextStatus } });
      } catch {
        // Automatically reverts on error
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading collection routes...</p>
      </div>
    );
  }

  if (optimisticRoutes.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
        <RouteIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Routes Scheduled</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Click &quot;Generate Route&quot; to aggregate verified premises into a daily collection manifest.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {optimisticRoutes.map((route) => {
        const percent = route.stopsCount > 0
          ? Math.round((route.completedStopsCount / route.stopsCount) * 100)
          : 0;

        return (
          <div
            key={route.id}
            className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[15px] font-bold text-slate-900 block">
                  Ward {route.wardNumber} Manifest
                </span>
                <span className="text-[12px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(route.routeDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {getRouteStatusBadge(route.status)}
            </div>

            {/* Waste Type & Assets */}
            <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Stream:</span>
                <span className="font-semibold text-slate-800">{route.wasteType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" /> Vehicle:
                </span>
                <span className="font-medium text-slate-800">
                  {route.vehicleRegistrationNo || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Driver:
                </span>
                <span className="font-medium text-slate-800">
                  {route.driverName || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Stops Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Collection Progress</span>
                <span className="text-emerald-700">
                  {route.completedStopsCount} / {route.stopsCount} stops ({percent}%)
                </span>
              </div>
              <Progress value={percent} className="h-2 bg-slate-100" />
            </div>

            {/* Status Transition Action Buttons */}
            <div className="pt-1 flex items-center justify-end gap-2">
              {route.status === 'DRAFT' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(route, 'DISPATCHED')}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Dispatch
                </Button>
              )}
              {route.status === 'DISPATCHED' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(route, 'IN_PROGRESS')}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Start Shift
                </Button>
              )}
              {route.status === 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(route, 'COMPLETED')}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Close Route
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

