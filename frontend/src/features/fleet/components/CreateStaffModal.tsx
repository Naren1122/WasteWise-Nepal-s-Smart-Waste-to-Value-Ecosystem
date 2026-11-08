'use client';

import React, { useState, useTransition } from 'react';
import { useCreateStaff } from '../hooks/useFleet';
import { useAdminWards } from '@/features/wards/hooks/useWardsAdmin';
import { DriverPhotoUpload } from './DriverPhotoUpload';
import type { StaffRole } from '../types/fleet.types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { UserCheck, AlertCircle, Loader2 } from 'lucide-react';

export interface CreateStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: StaffRole;
  onStaffCreated?: (staffName: string, role: string) => void;
  onDriverCreated?: (driverName: string) => void;
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
    if (apiErr.message && apiErr.message !== 'Invalid input payload') return apiErr.message;
  }
  return err instanceof Error ? err.message : 'Failed to create staff member';
}

export function CreateStaffModal({
  open, onOpenChange, defaultRole = 'DRIVER', onStaffCreated, onDriverCreated,
}: CreateStaffModalProps) {
  const [role, setRole] = useState<StaffRole>(defaultRole);
  const [wardId, setWardId] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('32');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Staff123!');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const createStaffMutation = useCreateStaff();
  const { data: wards = [] } = useAdminWards();

  const resetForm = () => {
    setRole(defaultRole); setWardId(''); setFullName(''); setAge('32');
    setPhone(''); setEmail(''); setPassword('Staff123!'); setPhotoDataUrl(null); setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAge = age ? parseInt(age, 10) : undefined;
    if (parsedAge && (parsedAge < 18 || parsedAge > 75)) {
      setErrorMessage('Age must be between 18 and 75 years old');
      return;
    }

    startTransition(async () => {
      try {
        await createStaffMutation.mutateAsync({
          fullName: fullName.trim(),
          role,
          age: parsedAge,
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          photo: photoDataUrl || undefined,
          wardId: role === 'WARD_OFFICER' && wardId ? wardId : undefined,
        });
        const createdName = fullName.trim();
        resetForm();
        onOpenChange(false);
        onStaffCreated?.(createdName, role);
        onDriverCreated?.(createdName);
      } catch (err: unknown) {
        setErrorMessage(formatApiError(err));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[490px] p-6 bg-white rounded-xl shadow-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Municipal Personnel</DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500">
            Provision staff with role-based access control (Driver, Ward Officer, Dispatcher, Field Worker).
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-[12.5px] text-rose-700 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {/* Role Selector & Ward Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <label className="text-[12.5px] font-bold text-slate-700 uppercase tracking-wider">Staff Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] bg-white font-medium text-slate-800 focus:border-emerald-600"
              >
                <option value="DRIVER">🚚 Driver (Route PWA &amp; GPS)</option>
                <option value="WARD_OFFICER">🏛️ Ward Officer (Complaints)</option>
                <option value="DISPATCHER">📋 Dispatcher (Fleet Routes)</option>
                <option value="FIELD_WORKER">👷 Field Crew (Helper)</option>
              </select>
            </div>

            {role === 'WARD_OFFICER' && (
              <div className="space-y-1">
                <label className="text-[12.5px] font-bold text-slate-700 uppercase tracking-wider">Assigned Ward *</label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] bg-white font-medium text-slate-800 focus:border-emerald-600"
                >
                  <option value="">Select Ward...</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      Ward {w.wardNumber} ({w.officeAddress || 'Municipal Office'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {(role === 'DRIVER' || role === 'FIELD_WORKER') && (
            <DriverPhotoUpload photoDataUrl={photoDataUrl} onPhotoChange={setPhotoDataUrl} onError={setErrorMessage} />
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Full Name *</label>
              <Input type="text" placeholder="e.g. Ramesh Karki" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-10 text-[14px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Age</label>
              <Input type="number" placeholder="32" min={18} max={75} value={age} onChange={(e) => setAge(e.target.value)} className="h-10 text-[14px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Mobile Phone *</label>
              <Input type="tel" placeholder="9841234567" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-10 text-[14px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700">Email Address *</label>
              <Input type="email" placeholder="staff@municipality.gov.np" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 text-[14px]" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-slate-700">Temporary Password *</label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 text-[14px] font-mono" />
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-10 text-[14px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="h-10 px-5 text-[14px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? 'Provisioning Staff...' : 'Create Staff Member'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const CreateDriverModal = CreateStaffModal;
