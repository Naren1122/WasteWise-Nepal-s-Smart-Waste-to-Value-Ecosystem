'use client';

import React, { useState, useEffect } from 'react';
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

interface PublicMunicipality {
  id: string;
  name: string;
  subdomain: string;
  district: string;
  province: string;
}

const registerFormSchema = z.object({
  tenantId: z.string().uuid('Please select your municipality'),
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
  const [municipalities, setMunicipalities] = useState<PublicMunicipality[]>([]);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      tenantId: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchMunicipalities() {
      try {
        const res = await apiClient.get<PublicMunicipality[]>('/tenants/public');
        if (isMounted && res.data) {
          setMunicipalities(res.data);
          if (res.data.length === 1 && res.data[0]) {
            setValue('tenantId', res.data[0].id);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoadingMunicipalities(false);
      }
    }
    void fetchMunicipalities();
    return () => {
      isMounted = false;
    };
  }, [setValue]);

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setErrorMessage(null);
    try {
      const response = await apiClient.post<AuthSession>('/auth/register', {
        tenantId: data.tenantId,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        role: 'CITIZEN',
      });

      setSession(response.data);
      toast.success('Registration successful', {
        description: `Welcome to WasteWise, ${response.data.user.fullName}!`,
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
        toast.error('Registration failed', { description: err.message });
      } else {
        setErrorMessage('Failed to complete registration. Please check your network.');
        toast.error('Registration failed', { description: 'Please check your network and try again.' });
      }
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200/90">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden border border-emerald-200/80 bg-white shadow-xs">
          <Image src="/logo.webp" alt="WasteWise Logo" width={52} height={52} className="object-contain" priority />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Citizen Account</h1>
        <p className="text-sm text-slate-500 mt-1">Register for doorstep waste collection & tracking</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <label className="block text-[14px] font-medium text-slate-700 mb-1">
            Municipality
          </label>
          <select
            className="w-full h-10 px-3 text-[15px] rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={isLoadingMunicipalities}
            {...register('tenantId')}
          >
            <option value="">
              {isLoadingMunicipalities ? 'Loading municipalities...' : 'Select your municipality'}
            </option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.district})
              </option>
            ))}
          </select>
          {errors.tenantId?.message && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.tenantId.message}</p>
          )}
        </div>

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
