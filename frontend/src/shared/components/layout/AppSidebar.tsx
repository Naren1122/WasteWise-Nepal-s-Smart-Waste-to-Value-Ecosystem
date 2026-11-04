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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/shared/components/ui/sidebar';
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  Truck,
  MapPin,
  Receipt,
  AlertCircle,
  Shield,
  Building2,
  LogOut,
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

export function AppSidebar() {
  const pathname = usePathname();
  const { user, tenantSubdomain, logout } = useAuthStore();

  const isStaff = user && ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER', 'DISPATCHER'].includes(user.role);

  return (
    <ShadcnSidebar collapsible="icon" className="border-r border-slate-300 bg-white">
      {/* Sidebar Header: Municipality Tenant Branding */}
      <SidebarHeader className="border-b border-slate-200 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-xl shadow-xs shrink-0">
            W
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-[17px] text-slate-900 leading-tight truncate tracking-tight">
              WasteWise
            </span>
            <span className="text-[12.5px] font-bold text-emerald-700 uppercase tracking-wider truncate mt-0.5">
              {tenantSubdomain || 'Municipal SaaS'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Navigation Links */}
      <SidebarContent className="px-2.5 py-3.5 space-y-2">
        {/* Citizen & Common Services */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[12.5px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Core Services
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 hover:text-emerald-800'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    >
                      <Link href={item.url} className="flex items-center gap-3 text-[15px] py-1.5">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Municipal Staff / Admin Management Group */}
        {isStaff && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[12.5px] font-bold text-slate-400 uppercase tracking-wider px-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Municipal Operations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {municipalNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 hover:text-emerald-800'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }
                      >
                        <Link href={item.url} className="flex items-center gap-3 text-[15px] py-1.5">
                          <Icon className="h-5 w-5 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Sidebar Footer: User Profile & Logout */}
      <SidebarFooter className="border-t border-slate-200 p-3">
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.fullName
                ? user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'WW'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold text-slate-900 truncate leading-tight">
                {user?.fullName || 'User'}
              </span>
              <span className="text-[11.5px] font-semibold text-emerald-700 uppercase tracking-wide truncate mt-0.5">
                {user?.role || 'Citizen'}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>

      {/* Collapsible Drag Rail */}
      <SidebarRail />
    </ShadcnSidebar>
  );
}

// Backward compatibility export
export const Sidebar = AppSidebar;

