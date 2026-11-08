'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/shared/stores/auth.store';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Plus, RefreshCw, Building2 } from 'lucide-react';
import { WelcomeBanner } from '@/features/dashboard/components/WelcomeBanner';
import { KpiMetricsGrid } from '@/features/dashboard/components/KpiMetricsGrid';
import { ActionHubCards } from '@/features/dashboard/components/ActionHubCards';
import { LiveFleetStatusCard } from '@/features/dashboard/components/LiveFleetStatusCard';
import { OnboardMunicipalityModal } from '@/features/admin/components/OnboardMunicipalityModal';

export default function DashboardOverviewPage() {
  const { user, tenantSubdomain } = useAuth();
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  const formatRole = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'MUNICIPAL_ADMIN':
        return 'Municipal Admin';
      case 'WARD_OFFICER':
        return 'Ward Officer';
      case 'DRIVER':
        return 'Route Driver';
      case 'CITIZEN':
      default:
        return 'Citizen';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Standardized Responsive Page Header */}
      <PageHeader
        title="Dashboard Overview"
        badge={
          <Badge variant="active" className="hidden sm:inline-flex ml-1 font-bold">
            {tenantSubdomain?.toUpperCase() || 'KATHMANDU'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-10 px-3 sm:px-4 text-[14px] rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Refresh dashboard"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {user?.role === 'SUPER_ADMIN' ? (
              <Button
                onClick={() => setIsOnboardOpen(true)}
                className="h-10 px-3 sm:px-4 text-[14px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>Onboard Municipality</span>
              </Button>
            ) : (
              <Button asChild variant="primary" className="h-10 px-3 sm:px-4 text-[14px] font-semibold rounded-lg shadow-xs">
                <Link href="/properties/register" className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Register New Property</span>
                  <span className="md:hidden">Register</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Main Work Area: Mobile, Tablet & Desktop Responsive Layout */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 w-full max-w-7xl mx-auto">
        {/* Welcome Hero Banner with Node Status */}
        <WelcomeBanner
          userName={user?.fullName}
          tenantSubdomain={tenantSubdomain}
        />

        {/* 4 Large Balanced KPI Metric Cards (1 col mobile, 2 col tablet, 4 col desktop) */}
        <KpiMetricsGrid
          roleName={formatRole(user?.role)}
          propertyCount={1}
        />

        {/* Operational Action Hub (Citizen Property Registry & Wards Management) */}
        <ActionHubCards />

        {/* Live Fleet Dispatch & Ward Status (Kathmandu Metro Telemetry) */}
        <LiveFleetStatusCard />
      </main>

      <OnboardMunicipalityModal
        open={isOnboardOpen}
        onOpenChange={setIsOnboardOpen}
      />
    </div>
  );
}
