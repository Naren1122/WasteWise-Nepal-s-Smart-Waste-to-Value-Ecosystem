'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { useActiveDriverRoute } from '@/features/routes/hooks/useRoutes';
import { useOfflineSync } from '@/features/routes/hooks/useOfflineSync';
import { DriverStopCard } from '@/features/routes/components/DriverStopCard';
import type { StopStatus, RouteStop } from '@/features/routes/types/routes.types';
import {
  Truck,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function DriverPwaPage() {
  const { data: route, isLoading, refetch, isRefetching } = useActiveDriverRoute();
  const [localStops, setLocalStops] = useState<RouteStop[]>([]);

  // Sync local stops whenever fresh route data arrives from server
  React.useEffect(() => {
    if (route?.stops) {
      setLocalStops(route.stops);
    }
  }, [route?.stops]);

  const { isOnline, pendingCount, queueOfflineStop, syncNow, isSyncing } = useOfflineSync(() => {
    void refetch();
  });

  const handleUpdateStop = (
    stopId: string,
    status: StopStatus,
    failureReason?: string,
    notes?: string
  ) => {
    // 1. Instant local UI update
    setLocalStops((prev) =>
      prev.map((s) =>
        s.id === stopId
          ? {
              ...s,
              status,
              failureReason: failureReason || null,
              notes: notes || null,
              completedAt: new Date().toISOString(),
            }
          : s
      )
    );

    // 2. Queue for online/offline synchronization
    queueOfflineStop({
      stopId,
      status,
      failureReason,
      notes,
      completedAt: new Date().toISOString(),
    });
  };

  const completedCount = localStops.filter((s) => s.status === 'COLLECTED').length;
  const totalCount = localStops.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PageHeader
        title="Field Worker Run"
        badge={
          <div className="flex items-center gap-1.5 ml-2">
            {isOnline ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                <Wifi className="w-3 h-3 mr-1 text-emerald-600" /> Online
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                <WifiOff className="w-3 h-3 mr-1 text-amber-600" /> Offline ({pendingCount} queued)
              </Badge>
            )}
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Offline Sync Banner if actions are pending */}
        {pendingCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-[13px] text-amber-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{pendingCount} collection stop(s) waiting to sync</span>
            </div>
            {isOnline && (
              <Button
                size="sm"
                onClick={() => void syncNow()}
                disabled={isSyncing}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Sync Now
              </Button>
            )}
          </div>
        )}

        {/* Active Route Overview Card */}
        {route ? (
          <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                  Active Collection Shift
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Ward {route.wardNumber} - {route.wasteType} Waste
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Vehicle</span>
                <span className="font-bold text-[14px] text-slate-800">
                  {route.vehicleRegistrationNo || 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Route Completion</span>
                <span className="text-emerald-700">
                  {completedCount} / {totalCount} collected ({progressPercent}%)
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5 bg-slate-100" />
            </div>
          </Card>
        ) : !isLoading ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Dispatched Route</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
              You do not have any active daily collection routes assigned for today. Contact your municipal dispatcher.
            </p>
          </div>
        ) : null}

        {/* Collection Stops List */}
        <div className="space-y-2.5">
          {localStops.map((stop) => (
            <DriverStopCard
              key={stop.id}
              stop={stop}
              onUpdateStatus={handleUpdateStop}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

