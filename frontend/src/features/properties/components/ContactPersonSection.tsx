'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { UserCheck, User, ShieldCheck } from 'lucide-react';

interface ContactPersonSectionProps {
  contactName: string;
  contactPhone: string;
  contactNameError?: string;
  contactPhoneError?: string;
  isSubmitting?: boolean;
  onContactNameChange: (val: string) => void;
  onContactPhoneChange: (val: string) => void;
  onCancel?: () => void;
}

export function ContactPersonSection({
  contactName,
  contactPhone,
  contactNameError,
  contactPhoneError,
  isSubmitting,
  onContactNameChange,
  onContactPhoneChange,
  onCancel,
}: ContactPersonSectionProps) {
  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <UserCheck className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            3. Authorized Contact Person
          </h2>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100/80 border-slate-300">
          ACCOUNT HOLDER
        </Badge>
      </div>

      {/* Two-Column Contact Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Contact Person Name */}
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-slate-800">
            Contact Person Full Name *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <Input
              placeholder="e.g. Bikash Shrestha"
              value={contactName}
              onChange={(e) => onContactNameChange(e.target.value)}
              className="h-11 pl-10 border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-emerald-600/20 text-[14px]"
            />
          </div>
          <p className="text-[12px] text-slate-500">
            Primary municipal notification receiver
          </p>
          {contactNameError && (
            <p className="text-[12px] font-medium text-rose-600">{contactNameError}</p>
          )}
        </div>

        {/* Contact Phone Number */}
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-slate-800">
            Contact Mobile / Phone *
          </label>
          <div className="flex rounded-lg border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 overflow-hidden bg-white">
            <span className="inline-flex items-center gap-1 px-3 bg-slate-100 border-r border-slate-300 text-[12px] font-bold text-slate-700 select-none">
              <span>NP</span>
              <span className="text-slate-500 font-medium">+977</span>
            </span>
            <input
              type="text"
              placeholder="9841234567"
              value={contactPhone}
              onChange={(e) => onContactPhoneChange(e.target.value)}
              className="w-full h-11 px-3 text-[14px] bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <p className="text-[12px] text-slate-500">
            Linked for SMS pickup alerts & bill receipt
          </p>
          {contactPhoneError && (
            <p className="text-[12px] font-medium text-rose-600">{contactPhoneError}</p>
          )}
        </div>
      </div>

      {/* Footer Form Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 px-4 text-[14px] font-medium rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
            >
              Cancel & Exit
            </Button>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="h-11 px-6 text-[14px] font-bold rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs inline-flex items-center gap-2 w-full sm:w-auto"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Submit for Verification</span>
        </Button>
      </div>
    </Card>
  );
}
