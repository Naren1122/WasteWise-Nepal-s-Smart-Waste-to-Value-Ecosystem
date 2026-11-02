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

const registerFormSchema = z.object({
  subdomain: z.string().min(2, 'Municipality subdomain is required'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(?:\+977)?(?:98|97)\d{8}$/, 'Must be a valid Nepali mobile (e.g. 9841234567)'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      subdomain: 'kathmandu',
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setErrorMessage(null);
    try {
      const response = await apiClient.request<AuthSession>('/auth/register', {
        method: 'POST',
        headers: {
          'X-Tenant-Subdomain': data.subdomain.trim().toLowerCase(),
        },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          password: data.password,
          role: 'CITIZEN',
        }),
      });

      setSession(response.data);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to complete registration. Please check your network.');
      }
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200/90">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Citizen Account</h1>
        <p className="text-sm text-slate-500 mt-1">Register for doorstep waste collection & tracking</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Municipality Subdomain"
          placeholder="e.g. kathmandu"
          error={errors.subdomain?.message}
          {...register('subdomain')}
        />

        <Input
          label="Full Legal Name"
          placeholder="e.g. Ram Bahadur Thapa"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="citizen@domain.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Nepali Mobile Number"
          placeholder="9841234567"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Password (min 8 characters)"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
          Complete Registration
        </Button>
      </form>
    </Card>
  );
};

