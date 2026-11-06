'use client';

import React from 'react';
import { SidebarTrigger } from '@/shared/components/ui/sidebar';
import { Separator } from '@/shared/components/ui/separator';

export interface PageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, badge, actions }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-300 bg-white px-4 sm:px-6 sticky top-0 z-10 gap-3 sm:gap-4 shadow-2xs">
      {/* Left: Mobile sidebar trigger, title and optional badge */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 min-w-0">
        <SidebarTrigger className="-ml-1 h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0 md:hidden cursor-pointer" />
        <Separator orientation="vertical" className="h-5 md:hidden shrink-0" />
        <h1 className="text-[16px] sm:text-xl lg:text-[22px] font-bold tracking-tight text-slate-900 whitespace-nowrap">
          {title}
        </h1>
        {badge}
      </div>

      {/* Right: Action buttons */}
      {actions && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

export default PageHeader;

