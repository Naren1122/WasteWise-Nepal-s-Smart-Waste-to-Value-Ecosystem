import type React from 'react';
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  Truck,
  MapPin,
  Receipt,
  AlertCircle,
  Building2,
  BarChart3,
  FileSpreadsheet,
  History,
} from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

export const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Properties', url: '/properties', icon: Home },
  { title: 'Collection Schedules', url: '/schedules', icon: CalendarDays },
  { title: 'Live GPS Tracking', url: '/tracking', icon: MapPin },
  { title: 'Invoices & Payments', url: '/invoices', icon: Receipt },
  { title: 'Complaints / Redressal', url: '/complaints', icon: AlertCircle },
];

export const municipalNavItems: NavItem[] = [
  {
    title: 'Fleet & Route Control',
    url: '/fleet',
    icon: Truck,
    roles: ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'DISPATCHER'],
  },
  {
    title: 'Wards & Service Zones',
    url: '/wards-admin',
    icon: Building2,
    roles: ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER'],
  },
  {
    title: 'Analytics & KPIs',
    url: '/analytics',
    icon: BarChart3,
    roles: ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER'],
  },
  {
    title: 'Export Reports',
    url: '/reports',
    icon: FileSpreadsheet,
    roles: ['MUNICIPAL_ADMIN', 'SUPER_ADMIN', 'WARD_OFFICER'],
  },
  {
    title: 'Audit Trail',
    url: '/audit',
    icon: History,
    roles: ['MUNICIPAL_ADMIN', 'SUPER_ADMIN'],
  },
];

