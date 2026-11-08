'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FaqSection } from './FaqSection';
import { Footer } from './Footer';

export function LandingView() {
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

  // If already authenticated or verifying session, show loading and redirect
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Opening Municipal Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-emerald-500 selection:text-white scroll-smooth">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

