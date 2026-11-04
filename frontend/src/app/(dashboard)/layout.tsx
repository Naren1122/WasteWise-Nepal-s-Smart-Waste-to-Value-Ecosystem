'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';
import { AppSidebar } from '@/shared/components/layout/AppSidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/shared/components/ui/sidebar';
import { Separator } from '@/shared/components/ui/separator';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying Municipal Session...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-slate-50">
        {/* Reusable shadcn/ui Sidebar */}
        <AppSidebar />

        {/* Dynamic Main Workspace Content */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-slate-50">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
