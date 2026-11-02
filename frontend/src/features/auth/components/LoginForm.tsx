'use client';

import React, { useState } from 'react';
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

const loginFormSchema = z.object({
  subdomain: z.string().min(2, 'Municipality subdomain is required (e.g. kathmandu)'),
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
      subdomain: 'kathmandu',
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setErrorMessage(null);
    try {
      const response = await apiClient.request<AuthSession>('/auth/login', {
        method: 'POST',
        headers: {
          'X-Tenant-Subdomain': data.subdomain.trim().toLowerCase(),
        },
        body: JSON.stringify({
          identifier: data.identifier.trim(),
          password: data.password,
        }),
      });

      setSession(response.data);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to authentication service. Please check network.');
      }
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200/90">
      <div className="mb-6 text-center">
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
          label="Municipality Subdomain"
          placeholder="e.g. kathmandu or lalitpur"
          error={errors.subdomain?.message}
          {...register('subdomain')}
        />

        <Input
          label="Email or Mobile Number"
          placeholder="e.g. 9841234567 or citizen@kathmandu.gov.np"
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

