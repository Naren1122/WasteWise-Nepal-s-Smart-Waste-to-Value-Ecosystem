'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { MapPin, Compass } from 'lucide-react';

interface PhysicalLocationSectionProps {
  streetAddress: string;
  streetAddressError?: string;
  onStreetAddressChange: (val: string) => void;
  onLocateClick?: () => void;
}

export function PhysicalLocationSection({
  streetAddress,
  streetAddressError,
  onStreetAddressChange,
  onLocateClick,
}: PhysicalLocationSectionProps) {
  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <MapPin className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            2. Physical Location Details
          </h2>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100/80 border-slate-300">
          PHYSICAL ACCESS
        </Badge>
      </div>

      {/* Street Address / Landmark with Geocode Button */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-semibold text-slate-800">
          Street Address / Landmark *
        </label>
        <div className="relative">
          <Input
            placeholder="Near Baluwatar Chowk, Uttar Marg, Ward-3"
            value={streetAddress}
            onChange={(e) => onStreetAddressChange(e.target.value)}
            className="h-11 pr-11 border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-emerald-600/20 text-[14px]"
          />
          {onLocateClick && (
            <button
              type="button"
              onClick={onLocateClick}
              title="Locate pin from current GPS"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}
        </div>
        {streetAddressError && (
          <p className="text-[12px] font-medium text-rose-600">{streetAddressError}</p>
        )}
      </div>
    </Card>
  );
}
