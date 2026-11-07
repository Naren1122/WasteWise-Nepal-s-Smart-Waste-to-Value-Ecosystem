'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { LiveVehicleState, RouteBreadcrumb } from '../types/tracking.types';

interface LiveOperationsMapProps {
  vehicles: LiveVehicleState[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  breadcrumbs?: RouteBreadcrumb[];
}

// Lazy-load Leaflet map component with ssr: false to prevent SSR hydration errors
const DynamicLiveMap = dynamic(
  () => import('./LiveOperationsMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-48 h-4 rounded-md" />
        <span className="text-xs font-medium text-slate-400">Loading interactive satellite & street map...</span>
      </div>
    ),
  }
);

export function LiveOperationsMap(props: LiveOperationsMapProps) {
  return <DynamicLiveMap {...props} />;
}

