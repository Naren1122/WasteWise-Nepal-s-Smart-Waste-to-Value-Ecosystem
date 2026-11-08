'use client';

import React, { useState, useTransition } from 'react';
import { useMunicipalityOnboarding } from '../hooks/useMunicipalityOnboarding';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Building2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface OnboardMunicipalityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (municipalityName: string, subdomain: string) => void;
}

function formatApiError(err: unknown): string {
  if (err && typeof err === 'object') {
    const apiErr = err as { message?: string; details?: Record<string, string[] | undefined> };
    if (apiErr.details && typeof apiErr.details === 'object') {
      const fieldErrors = Object.entries(apiErr.details)
        .filter(([_, v]) => Array.isArray(v) && v.length > 0)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v?.[0]}`);
      if (fieldErrors.length > 0) return fieldErrors.join(' • ');
    }
    if (apiErr.message) return apiErr.message;
  }
  return err instanceof Error ? err.message : 'Failed to onboard municipality';
}

export function OnboardMunicipalityModal({ open, onOpenChange, onSuccess }: OnboardMunicipalityModalProps) {
  const [municipalityName, setMunicipalityName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [province, setProvince] = useState('Bagmati Province');
  const [district, setDistrict] = useState('Kathmandu');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('Password123!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const onboardMutation = useMunicipalityOnboarding();

  const resetForm = () => {
    setMunicipalityName('');
    setSubdomain('');
    setProvince('Bagmati Province');
    setDistrict('Kathmandu');
    setAdminFullName('');
    setAdminEmail('');
    setAdminPhone('');
    setAdminPassword('Password123!');
    setErrorMessage(null);
  };

  const handleSubdomainAutoFill = (name: string) => {
    setMunicipalityName(name);
    if (!subdomain || subdomain === municipalityName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const slug = name
        .toLowerCase()
        .replace(/metropolitan city|sub-metropolitan city|municipality/g, '')
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSubdomain(slug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await onboardMutation.mutateAsync({
          municipalityName: municipalityName.trim(),
          subdomain: subdomain.trim().toLowerCase(),
          province: province.trim(),
          district: district.trim(),
          adminFullName: adminFullName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminPhone: adminPhone.trim(),
          adminPassword: adminPassword.trim(),
        });
        const name = municipalityName.trim();
        const sub = subdomain.trim().toLowerCase();
        resetForm();
        onOpenChange(false);
        onSuccess?.(name, sub);
      } catch (err: unknown) {
        setErrorMessage(formatApiError(err));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-6 bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Onboard New Municipality</DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            Create an isolated municipal SaaS tenant and assign its initial Municipal Administrator.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-[12.5px] text-rose-700 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Municipality Details Section */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" /> 1. Municipality Details
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Municipality Name *</label>
              <Input type="text" placeholder="e.g. Kathmandu Metropolitan City" value={municipalityName} onChange={(e) => handleSubdomainAutoFill(e.target.value)} required className="h-10 text-[14px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[13px] font-semibold text-slate-700">Subdomain *</label>
                <Input type="text" placeholder="kathmandu" value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase())} required className="h-10 text-[14px] font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-semibold text-slate-700">Province *</label>
                <Input type="text" value={province} onChange={(e) => setProvince(e.target.value)} required className="h-10 text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-semibold text-slate-700">District *</label>
                <Input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} required className="h-10 text-[14px]" />
              </div>
            </div>
          </div>

          {/* Municipal Admin Account Section */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 2. Municipal Admin Account
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Admin Full Name *</label>
              <Input type="text" placeholder="e.g. Sita Sharma" value={adminFullName} onChange={(e) => setAdminFullName(e.target.value)} required className="h-10 text-[14px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[13px] font-semibold text-slate-700">Admin Mobile Phone *</label>
                <Input type="tel" placeholder="9851000001" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} required className="h-10 text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-semibold text-slate-700">Admin Email *</label>
                <Input type="email" placeholder="admin@kathmandu.gov.np" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="h-10 text-[14px]" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Temporary Admin Password *</label>
              <Input type="text" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required className="h-10 text-[14px] font-mono" />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-10 text-[14px]">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="h-10 px-5 text-[14px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? 'Provisioning...' : 'Provision Municipality'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

