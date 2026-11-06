'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  Truck,
  MapPin,
  Receipt,
  AlertCircle,
  Building2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth.store';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Properties', url: '/properties', icon: Home },
  { title: 'Collection Schedules', url: '/schedules', icon: CalendarDays },
  { title: 'Live GPS Tracking', url: '/tracking', icon: MapPin },
  { title: 'Invoices & Payments', url: '/invoices', icon: Receipt },
  { title: 'Complaints / Redressal', url: '/complaints', icon: AlertCircle },
];

const municipalNavItems: NavItem[] = [
  { title: 'Fleet & Route Control', url: '/fleet', icon: Truck, roles: ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'DISPATCHER'] },
  { title: 'Wards & Service Zones', url: '/wards-admin', icon: Building2, roles: ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER'] },
];

function formatRole(role?: string): string {
  if (!role) return 'Citizen';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, tenantSubdomain, logout } = useAuthStore();
  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === 'collapsed';
  const isStaff = user && ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER', 'DISPATCHER'].includes(user.role);

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'WW';

  const renderNavList = (items: NavItem[]) => (
    <SidebarMenu className="gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.url;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
              className={`h-10 rounded-xl transition-all duration-150 font-medium text-[14px] group ${
                isActive
                  ? '!bg-emerald-600 !text-white font-semibold shadow-xs hover:!bg-emerald-700 hover:!text-white'
                  : 'text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-950'
              }`}
            >
              <Link href={item.url} className="flex items-center gap-3 px-2.5">
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                    isActive
                      ? '!text-white'
                      : 'text-slate-500 group-hover:text-emerald-600'
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <ShadcnSidebar collapsible="icon" className="border-r border-slate-200/90 bg-white">
      {/* 1. Header: Municipality Branding & Clean Integrated Shrink Toggle */}
      <SidebarHeader className="border-b border-slate-100 p-2.5">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            title="Expand Sidebar"
            className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-base shadow-xs hover:bg-emerald-700 transition-all cursor-pointer group relative"
          >
            <span className="group-hover:hidden">W</span>
            <PanelLeftOpen className="w-5 h-5 hidden group-hover:block" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-base shadow-xs shrink-0">
                W
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-[15px] text-slate-900 leading-tight truncate tracking-tight">
                  WasteWise
                </span>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider truncate mt-0.5">
                  {tenantSubdomain || 'Municipal SaaS'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              title="Shrink sidebar"
              className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <PanelLeftClose className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </SidebarHeader>

      {/* 2. Navigation Content */}
      <SidebarContent className="px-2.5 py-3 space-y-4">
        {/* Core Services Section */}
        <SidebarGroup className="p-0">
          {!isCollapsed && (
            <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5 block">
              Core Services
            </span>
          )}
          <SidebarGroupContent>
            {renderNavList(mainNavItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Municipal Operations Section */}
        {isStaff && (
          <SidebarGroup className="p-0 pt-2 border-t border-slate-100">
            {!isCollapsed && (
              <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5 block">
                Municipal Operations
              </span>
            )}
            <SidebarGroupContent>
              {renderNavList(municipalNavItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* 3. Footer: Refined User Profile Card & Signout */}
      <SidebarFooter className="border-t border-slate-100 p-2.5">
        {isCollapsed ? (
          <button
            onClick={() => logout()}
            title={`Signed in as ${user?.fullName || 'User'} (${formatRole(user?.role)}). Click to sign out.`}
            className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-bold text-xs flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all cursor-pointer group"
          >
            <span className="group-hover:hidden">{userInitials}</span>
            <LogOut className="w-4 h-4 hidden group-hover:block text-rose-600" />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8.5 h-8.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-slate-900 truncate leading-tight">
                  {user?.fullName || 'User'}
                </span>
                <span className="text-[11px] font-medium text-emerald-700 truncate mt-0.5">
                  {formatRole(user?.role)}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
}

export const Sidebar = AppSidebar;
