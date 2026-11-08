'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import { apiClient, ApiClientError } from '../../../shared/lib/api-client';
import { AuthSession } from '../../../shared/types/api.types';
import { useAuth } from '../hooks/useAuth';
import { toast } from '@/shared/components/ui/sonner';

const loginFormSchema = z.object({
  identifier: z.string().min(3, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: 'superadmin@wastewise.gov.np',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setErrorMessage(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wastewise_tokens');
        localStorage.removeItem('wastewise_tenant_id');
        localStorage.removeItem('wastewise_tenant_subdomain');
      }

      const response = await apiClient.post<AuthSession>('/auth/login', {
        identifier: data.identifier.trim(),
        password: data.password,
      });

      setSession(response.data);
      toast.success('Signed in successfully', {
        description: `Welcome back, ${response.data.user.fullName || response.data.user.role.replace(/_/g, ' ')}!`,
      });
      if (response.data.user.role === 'DRIVER') {
        router.push('/driver');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
        toast.error('Authentication failed', { description: err.message });
      } else {
        setErrorMessage('Failed to connect to authentication service. Please check network.');
        toast.error('Authentication failed', { description: 'Please check network and try again.' });
      }
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200/90">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden border border-emerald-200/80 bg-white shadow-xs">
          <Image src="/logo.webp" alt="WasteWise Logo" width={52} height={52} className="object-contain" priority />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to WasteWise</h1>
        <p className="text-sm text-slate-500 mt-1">Smart Municipal Waste Operations & Citizen Portal</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email or Mobile Number"
          placeholder="e.g. 9841234567 or superadmin@wastewise.gov.np"
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
          Sign In
        </Button>
      </form>
    </Card>
  );
};
