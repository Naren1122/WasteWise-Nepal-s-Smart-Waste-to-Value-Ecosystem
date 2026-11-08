'use client';

import React, { useState, useTransition } from 'react';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useComplaints } from '@/features/complaints/api/useComplaints';
import { useAdminWards } from '@/features/wards/hooks/useWardsAdmin';
import { CitizenComplaintForm } from '@/features/complaints/components/CitizenComplaintForm';
import { ComplaintKanbanBoard } from '@/features/complaints/components/ComplaintKanbanBoard';
import { ComplaintDetailSheet } from '@/features/complaints/components/ComplaintDetailSheet';
import { CATEGORY_LABELS } from '@/features/complaints/types/complaints.types';
import type { ComplaintCategory } from '@/features/complaints/types/complaints.types';
import { PlusCircle, Search, AlertTriangle, LayoutDashboard, Loader2 } from 'lucide-react';

export default function ComplaintsPage() {
  const { user } = useAuthStore();
  const isStaff = Boolean(user?.role && ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DISPATCHER'].includes(user.role));
  const canTriage = Boolean(user?.role && ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER'].includes(user.role));

  const [activeTab, setActiveTab] = useState<string>(isStaff ? 'kanban' : 'report');
  const [, startTransition] = useTransition();

  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const { data: wardsData } = useAdminWards();
  const wards = (wardsData ?? []).map((w) => ({ id: w.id, wardNumber: w.wardNumber }));

  const queryFilters = {
    wardId: selectedWardId !== 'ALL' ? selectedWardId : undefined,
    category: selectedCategory !== 'ALL' ? (selectedCategory as ComplaintCategory) : undefined,
    search: searchQuery.trim() || undefined,
    isSlaBreached: activeTab === 'sla' ? true : undefined,
  };

  const { data: complaintsData, isLoading, refetch, isFetching } = useComplaints(queryFilters);
  const complaints = complaintsData?.data ?? [];
  const breachedCount = complaints.filter((c) => c.isSlaBreached).length;

  const handleTabChange = (val: string) => {
    startTransition(() => {
      setActiveTab(val);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60">
      <PageHeader
        title="Citizen Grievances & Redressal"
        badge={
          breachedCount > 0 ? (
            <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1 hidden sm:inline-flex">
              <AlertTriangle className="h-3 w-3" /> {breachedCount} Breached
            </Badge>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleTabChange('report')}
              className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" /> Report Issue
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <TabsList className="bg-slate-200/80 p-1 rounded-lg">
              <TabsTrigger value="kanban" className="gap-1.5 text-xs sm:text-sm">
                <LayoutDashboard className="h-4 w-4" /> Kanban Board
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-1.5 text-xs sm:text-sm">
                <PlusCircle className="h-4 w-4" /> Report Grievance
              </TabsTrigger>
              <TabsTrigger value="sla" className="gap-1.5 text-xs sm:text-sm text-rose-700 data-[state=active]:text-rose-800">
                <AlertTriangle className="h-4 w-4" /> SLA Breaches
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search ticket # or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs border-slate-300"
                />
              </div>

              <Select value={selectedWardId} onValueChange={setSelectedWardId}>
                <SelectTrigger className="h-9 text-xs w-[130px] border-slate-300">
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Wards</SelectItem>
                  {wards.map((w) => (
                    <SelectItem key={w.id} value={w.id}>Ward {w.wardNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs w-[140px] border-slate-300">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="kanban" className="pt-2">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="text-sm">Loading complaints board...</span>
              </div>
            ) : (
              <ComplaintKanbanBoard
                complaints={complaints}
                onSelectComplaint={(id) => setSelectedComplaintId(id)}
                canTriage={canTriage}
              />
            )}
          </TabsContent>

          <TabsContent value="report" className="pt-2 max-w-2xl mx-auto">
            <CitizenComplaintForm
              wards={wards}
              onSuccess={() => {
                void refetch();
                setTimeout(() => handleTabChange('kanban'), 1200);
              }}
            />
          </TabsContent>

          <TabsContent value="sla" className="pt-2">
            <ComplaintKanbanBoard
              complaints={complaints.filter((c) => c.isSlaBreached)}
              onSelectComplaint={(id) => setSelectedComplaintId(id)}
              canTriage={canTriage}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ComplaintDetailSheet
        complaintId={selectedComplaintId}
        isOpen={!!selectedComplaintId}
        onClose={() => setSelectedComplaintId(null)}
        userRole={user?.role}
        userId={user?.id}
      />
    </div>
  );
}

