'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'DRIVER') {
        router.replace('/driver');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Prevent flash of login/register form if user is already authenticated
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Redirecting to session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

