'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Building2,
  Plus,
  ArrowRight,
  QrCode,
  Route,
  RefreshCw,
  MapPin,
  Users,
  Compass,
} from 'lucide-react';

export function ActionHubCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Citizen Property Registry */}
      <Card className="p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  Citizen Property Registry
                </h2>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  KMC URBAN TENURE & BILLING
                </span>
              </div>
            </div>
            <Badge variant="active" className="h-6 px-2.5 text-[11px] font-bold">
              ACTIVE
            </Badge>
          </div>

          <p className="text-[14px] text-slate-600 mt-3.5 leading-relaxed">
            Register household or business premises with GPS pin verification for scheduled waste pickup and automated municipal billing.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-medium border border-slate-200">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified QR tags: 100%</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-medium border border-slate-200">
              <Route className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto-route tagged</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-medium border border-slate-200">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>GIS Sync: 2m ago</span>
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <Button asChild variant="primary" className="h-10 px-4 text-[14px] font-semibold gap-1.5 w-full sm:w-auto">
            <Link href="/properties/register">
              <Plus className="w-4 h-4" />
              <span>+ Register New</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-10 px-4 text-[14px] font-semibold gap-1.5 w-full sm:w-auto">
            <Link href="/properties">
              <span>View List</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* 2. Wards & Collection Zones */}
      <Card className="p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  Wards & Collection Zones
                </h2>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  MUNICIPAL JURISDICTION & TOLES
                </span>
              </div>
            </div>
            <Badge variant="info" className="h-6 px-2.5 text-[11px] font-bold">
              SYNCHRONIZED
            </Badge>
          </div>

          <p className="text-[14px] text-slate-600 mt-3.5 leading-relaxed">
            Manage municipal ward boundaries, active collection toles, and assign officers across Kathmandu and Lalitpur nodes.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-medium border border-slate-200">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>32 KMC Wards Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-medium border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>8 Transfer Stations</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-medium border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>64 Ward Inspectors</span>
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="h-10 px-4 text-[14px] font-semibold gap-1.5 w-full sm:w-auto">
            <Link href="/wards-admin">
              <span>Explore Wards</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button asChild variant="ghost" className="h-10 px-3 text-[14px] font-medium text-slate-600 hover:text-slate-900 w-full sm:w-auto">
            <Link href="/tracking">
              <span>View Live Map</span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

