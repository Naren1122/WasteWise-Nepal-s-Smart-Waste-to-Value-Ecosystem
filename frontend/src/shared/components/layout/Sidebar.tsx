'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  Truck,
  MapPin,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Properties', href: '/properties', icon: Home },
  { label: 'Schedules', href: '/schedules', icon: CalendarDays },
  { label: 'Fleet & Routes', href: '/fleet', icon: Truck },
  { label: 'Live GPS Map', href: '/tracking', icon: MapPin },
  { label: 'Invoices & Pay', href: '/invoices', icon: Receipt },
  { label: 'Grievances', href: '/complaints', icon: AlertCircle },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-600' : 'text-slate-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
        <p className="font-semibold text-slate-700">WasteWise Platform</p>
        <p className="mt-0.5">Municipal Waste Management Engine v1.0</p>
      </div>
    </aside>
  );
};

