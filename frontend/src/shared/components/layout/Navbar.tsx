'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { Button } from '../ui/button';
import { LogOut, User as UserIcon, Building2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, tenantSubdomain, logout } = useAuth();

  const handleLogout = (): void => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          W
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-base">WasteWise</span>
          {tenantSubdomain && (
            <span className="ml-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Building2 className="w-3 h-3" />
              {tenantSubdomain.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-slate-600" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight text-slate-900">{user.fullName}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{user.role}</p>
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600">
          <LogOut className="w-4 h-4 mr-1.5" />
          Logout
        </Button>
      </div>
    </header>
  );
};

