'use client';

import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Card } from '../../shared/components/ui/card';
import { Home, CalendarCheck, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user, tenantSubdomain } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.fullName || 'Citizen'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Active Municipal Jurisdiction: <span className="font-semibold text-emerald-700">{tenantSubdomain?.toUpperCase()}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Registered Premises</p>
            <p className="text-xl font-bold text-slate-900">1 Property</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Next Pickup</p>
            <p className="text-xl font-bold text-slate-900">Tomorrow (Organic)</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Account Role</p>
            <p className="text-xl font-bold text-slate-900">{user?.role || 'CITIZEN'}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Dues</p>
            <p className="text-xl font-bold text-emerald-600">NPR 0 (Clear)</p>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-slate-900 mb-2">Phase 1 Status: Core Infrastructure Active</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The foundational multi-tenant architecture, strict TypeScript data pipeline, and role-based authentication slice are operational.
          Ready to advance to <strong>Phase 2: Master Data, Wards, Zones & Citizen Property Registry</strong>.
        </p>
      </Card>
    </div>
  );
}

