'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Truck,
  Navigation,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Activity,
  Gauge,
  Scale,
} from 'lucide-react';

export function LiveFleetStatusCard() {
  const routes = [
    {
      code: 'KMC-W03-A',
      ward: 'Ward 3 Maharajgunj / Lazimpat',
      vehicle: 'Vehicle Compactor #04 • Driver: Bikram Thapa',
      status: 'Collecting (74%)',
      statusVariant: 'active' as const,
      progress: 74,
      progressColor: 'bg-emerald-600',
      nextStop: 'Baluwatar Chowk',
      payload: '4.8 / 6.0 MT',
    },
    {
      code: 'KMC-W04-B',
      ward: 'Ward 4 Bishalnagar / Chandol',
      vehicle: 'Vehicle Tipper #12 • Driver: Rajan Shrestha',
      status: 'In Transit',
      statusVariant: 'info' as const,
      progress: 48,
      progressColor: 'bg-blue-600',
      nextStop: 'Sisdole / Bancharedada Landfill',
      payload: '7.2 MT (Full)',
    },
    {
      code: 'KMC-W01-C',
      ward: 'Ward 1 Naxal / Nagpokhari',
      vehicle: 'Vehicle EV-Van #02 • Driver: Sunita Maharjan',
      status: 'Done',
      statusVariant: 'active' as const,
      progress: 100,
      progressColor: 'bg-emerald-600',
      nextStop: 'Teku Central Transfer Node',
      payload: '2.2 MT',
      isCompleted: true,
    },
  ];

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Live Fleet Dispatch & Ward Status (Kathmandu Metro)
            </h2>
            <p className="text-[13px] text-slate-500">
              Real-time telemetry feeds, active payloads, and disposal route tracks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
        </div>
      </div>

      {/* Split grid: Route stream (Left) & Geospatial summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Route Stream */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {routes.map((route) => (
            <div
              key={route.code}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-900 text-white shrink-0">
                    {route.code}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-900 truncate">
                      {route.ward}
                    </h3>
                    <p className="text-[12px] text-slate-500 truncate">
                      {route.vehicle}
                    </p>
                  </div>
                </div>

                <Badge variant={route.statusVariant} className="self-start sm:self-auto h-5 px-2 text-[11px]">
                  {route.status}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${route.progressColor}`}
                  style={{ width: `${route.progress}%` }}
                />
              </div>

              {/* Bottom metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[12px] text-slate-600">
                <span className="inline-flex items-center gap-1.5 truncate">
                  {route.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                  <span>
                    {route.isCompleted ? 'Route Completed: ' : 'Next stop: '}
                    <strong className="text-slate-800 font-semibold">{route.nextStop}</strong>
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  Payload: {route.payload}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Geospatial Telemetry Widget */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active GPS Fix
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 text-[12px] font-bold">
                <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Live Lock
              </span>
            </div>

            {/* Visual map preview card */}
            <div className="w-full h-36 rounded-lg bg-gradient-to-br from-emerald-900 to-slate-900 p-3 flex flex-col justify-between text-white relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between z-10">
                <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs text-[10px] font-semibold uppercase tracking-wider">
                  Kathmandu Hub
                </span>
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="bg-slate-900/80 backdrop-blur-xs p-2 rounded-md border border-white/10 z-10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-300 uppercase block font-medium">GPS Center</span>
                  <span className="text-[12px] font-bold tracking-tight text-white font-mono">
                    27.7172° N, 85.3240° E
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>

            {/* Quick telemetry metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Today's Waste</span>
                </div>
                <span className="text-base font-extrabold text-slate-900 block mt-1">
                  14.2 MT
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  ↑ +8.4% vs avg
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fleet Speed</span>
                </div>
                <span className="text-base font-extrabold text-slate-900 block mt-1">
                  22.4 km/h
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Traffic: Normal
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[12px]">
            <span className="text-slate-500 truncate">Teku Transfer Station</span>
            <Link
              href="/tracking"
              className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 transition-colors"
            >
              <span>Full GIS Map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

