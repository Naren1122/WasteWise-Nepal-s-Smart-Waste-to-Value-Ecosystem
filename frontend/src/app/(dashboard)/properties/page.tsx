'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useMyProperties, useWards, Property } from '@/features/properties/hooks/useProperties';
import { PropertyCard } from '@/features/properties/components/PropertyCard';
import { PropertiesFilterBar } from '@/features/properties/components/PropertiesFilterBar';
import { PropertiesPagination } from '@/features/properties/components/PropertiesPagination';
import { AdminPropertyVerificationQueue } from '@/features/properties/components/AdminPropertyVerificationQueue';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Plus, Home, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function MyPropertiesPage() {
  const { user, tenantSubdomain } = useAuthStore();
  const isStaff = user && ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER'].includes(user.role);

  const [activeTab, setActiveTab] = useState<'MY_PROPERTIES' | 'STAFF_QUEUE' | 'ARCHIVED'>('MY_PROPERTIES');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  const { data: properties, isLoading, isError, error, refetch, isRefetching } = useMyProperties();
  const { data: wards } = useWards();

  // Filter properties by search query and ward
  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    return properties.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.streetAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.houseNumber && p.houseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesWard =
        selectedWardId === 'ALL' || p.wardId === selectedWardId;

      return matchesSearch && matchesWard;
    });
  }, [properties, searchQuery, selectedWardId]);

  // Pagination calculation
  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProperties.slice(start, start + pageSize);
  }, [filteredProperties, currentPage, pageSize]);

  const municipalityName = tenantSubdomain?.toUpperCase() || 'LALITPUR / KATHMANDU';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Header with Municipality & Metro ID Badges */}
      <PageHeader
        title="My Registered Properties"
        badge={
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 ml-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{municipalityName}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wide hidden md:inline">
              SEC-04 / METRO-ID: #8921
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="h-10 px-3.5 text-[13.5px] rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button asChild variant="primary" className="h-10 px-4 text-[13.5px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs">
              <Link href="/properties/register" className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Register New Property</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* 2. Top Segmented Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('MY_PROPERTIES')}
            className={`pb-3 px-3 text-[13.5px] font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'MY_PROPERTIES'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>My Properties (Active)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {properties?.length ?? 0}
            </span>
          </button>

          {isStaff && (
            <button
              type="button"
              onClick={() => setActiveTab('STAFF_QUEUE')}
              className={`pb-3 px-3 text-[13.5px] font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'STAFF_QUEUE'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Ward Verification Queue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                • 3 Pending
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVED')}
            className={`pb-3 px-3 text-[13.5px] font-medium transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'ARCHIVED'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <span>Archived & Transferred</span>
            <span className="text-[11px] text-slate-400">(0)</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-5">
        {activeTab === 'STAFF_QUEUE' ? (
          <AdminPropertyVerificationQueue />
        ) : activeTab === 'ARCHIVED' ? (
          <Card className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
            <p className="text-[14px] text-slate-500">No archived or transferred premises found.</p>
          </Card>
        ) : (
          <>
            {/* Search & Ward Filter Bar */}
            <PropertiesFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              selectedWardId={selectedWardId}
              onWardChange={(w) => {
                setSelectedWardId(w);
                setCurrentPage(1);
              }}
              wards={wards}
            />

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map((n) => (
                  <div key={n} className="h-64 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <Card className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-xl mx-auto my-6">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                <h3 className="text-[15px] font-bold text-rose-800">Failed to load premises</h3>
                <p className="text-[13px] text-rose-600 mt-1">
                  {error instanceof Error ? error.message : 'Please check your connection.'}
                </p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4 h-9">
                  Try Again
                </Button>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !isError && filteredProperties.length === 0 && (
              <Card className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs max-w-xl mx-auto">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No properties matched</h3>
                <p className="text-[13.5px] text-slate-500 mt-1 max-w-md mx-auto">
                  {searchQuery || selectedWardId !== 'ALL'
                    ? 'Try adjusting your search criteria or ward filter.'
                    : 'Enroll your first property for scheduled municipal waste collection.'}
                </p>
              </Card>
            )}

            {/* Properties Grid */}
            {!isLoading && !isError && paginatedProperties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {paginatedProperties.map((property: Property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && !isError && totalItems > 0 && (
              <PropertiesPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
