'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Property } from '../hooks/useProperties';
import { PropertyOperationalBoxes } from './PropertyOperationalBoxes';
import {
  Factory,
  Home,
  Store,
  GraduationCap,
  MoreVertical,
  Phone,
  Trash2,
  Calendar,
  QrCode,
  ArrowRight,
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
  onQrPassClick?: (property: Property) => void;
}

export function PropertyCard({ property, onSelect, onQrPassClick }: PropertyCardProps) {
  const getCategoryDetails = (type: Property['propertyType']) => {
    switch (type) {
      case 'INDUSTRIAL':
        return { label: 'INDUSTRIAL', icon: Factory };
      case 'COMMERCIAL':
        return { label: 'COMMERCIAL', icon: Store };
      case 'INSTITUTIONAL':
        return { label: 'INSTITUTIONAL', icon: GraduationCap };
      case 'RESIDENTIAL':
      default:
        return { label: 'RESIDENTIAL', icon: Home };
    }
  };

  const { label: categoryLabel, icon: CategoryIcon } = getCategoryDetails(property.propertyType);
  const isVerified = property.status === 'ACTIVE';

  const initials = property.contactName
    ? property.contactName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PR';

  const enrolledDate = new Date(property.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-4">
      {/* 1. Header Row: Category Badge, Status Badge & Action Menu */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-slate-900 text-white shadow-2xs">
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{categoryLabel}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
              isVerified
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isVerified ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{isVerified ? 'VERIFIED PREMISES' : 'PENDING VERIFICATION'}</span>
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-[13px]">
            <DropdownMenuItem onClick={() => onSelect?.(property)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQrPassClick?.(property)}>
              Digital QR Pass
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(
                  `${property.latitude}, ${property.longitude}`
                );
              }}
            >
              Copy Coordinates
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Title & Jurisdiction with Building Plate */}
      <div className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h3 className="text-lg sm:text-[19px] font-bold text-slate-900 leading-snug">
            {property.streetAddress}
          </h3>

          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11.5px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto shrink-0">
            <span className="px-1 py-0.2 rounded bg-slate-200 text-[10px] font-sans font-bold text-slate-600">
              123
            </span>
            <span>Plate: {property.houseNumber || `KMC-W${property.wardNumber ?? '01'}-842`}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[13px] text-slate-600">
          <Badge variant="active" className="h-5 px-2 text-[11px] font-bold">
            Ward No. {property.wardNumber ?? '1'}
          </Badge>
          <span className="text-slate-300">•</span>
          <span>Tole: {property.zoneName || 'Central Cluster A'}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Bagmati Province</span>
        </div>
      </div>

      {/* 3. Operational Split Box (Geofence + Pickup Schedule) */}
      <PropertyOperationalBoxes property={property} />

      {/* 4. Contact Person & Waste Footprint Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div>
            <span className="text-slate-800 font-semibold block leading-tight">
              Contact: {property.contactName}
            </span>
            <span className="text-slate-500 text-[12px] flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{property.contactPhone}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          <Trash2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="text-[12px] leading-tight">
            <span className="text-slate-500">Daily Waste Footprint: </span>
            <span className="font-bold text-slate-900">~45 kg/day</span>
            <span className="text-slate-500 ml-1">(Segregated)</span>
          </div>
        </div>
      </div>

      {/* 5. Footer: Date Enrolled & Quick Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Enrolled {enrolledDate}</span>
        </span>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => onQrPassClick?.(property)}
            className="h-9 px-3 text-[12.5px] font-semibold bg-sky-50/80 border-sky-200 text-sky-900 hover:bg-sky-100 gap-1.5 rounded-lg"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-700" />
            <span>Digital QR Pass</span>
          </Button>

          <Button
            asChild
            variant="primary"
            className="h-9 px-3.5 text-[12.5px] font-bold bg-emerald-900 hover:bg-emerald-950 text-white gap-1.5 rounded-lg shadow-2xs"
          >
            <Link href={`/properties`}>
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
