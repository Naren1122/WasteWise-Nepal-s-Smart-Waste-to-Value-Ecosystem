'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { PropertyRegisterForm } from '@/features/properties/components/PropertyRegisterForm';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export default function RegisterPropertyPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/properties');
  };

  const handleCancel = () => {
    router.push('/properties');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Standardized Reusable Page Header */}
      <PageHeader
        title="Register Premises"
        actions={
          <Button asChild variant="primary" className="h-10 px-4 text-[14px] font-semibold rounded-lg shadow-xs">
            <Link href="/properties">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to List</span>
            </Link>
          </Button>
        }
      />

      {/* 2. Main Work Area: Responsive Split Grid */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <PropertyRegisterForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </main>
    </div>
  );
}
