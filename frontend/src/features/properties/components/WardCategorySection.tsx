'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { PropertyType, Ward, ServiceZone } from '../hooks/useProperties';
import {
  Building2,
  Home,
  Store,
  GraduationCap,
  Factory,
  CheckCircle2,
} from 'lucide-react';

interface WardCategorySectionProps {
  wards?: Ward[];
  zones?: ServiceZone[];
  selectedWardId: string;
  selectedZoneId?: string | null;
  propertyType: PropertyType;
  houseNumber?: string | null;
  loadingWards?: boolean;
  loadingZones?: boolean;
  wardError?: string;
  onWardSelect: (wardId: string) => void;
  onZoneSelect: (zoneId: string | null) => void;
  onPropertyTypeChange: (type: PropertyType) => void;
  onHouseNumberChange: (val: string) => void;
}

export function WardCategorySection({
  wards,
  zones,
  selectedWardId,
  selectedZoneId,
  propertyType,
  houseNumber,
  loadingWards,
  loadingZones,
  wardError,
  onWardSelect,
  onZoneSelect,
  onPropertyTypeChange,
  onHouseNumberChange,
}: WardCategorySectionProps) {
  const propertyCategories = [
    {
      type: 'RESIDENTIAL' as PropertyType,
      title: 'Residential',
      subtitle: 'Household / Flat',
      icon: Home,
    },
    {
      type: 'COMMERCIAL' as PropertyType,
      title: 'Commercial',
      subtitle: 'Shop / Hotel / Office',
      icon: Store,
    },
    {
      type: 'INSTITUTIONAL' as PropertyType,
      title: 'Institutional',
      subtitle: 'School / Hospital',
      icon: GraduationCap,
    },
    {
      type: 'INDUSTRIAL' as PropertyType,
      title: 'Industrial',
      subtitle: 'Unit / Warehouse',
      icon: Factory,
    },
  ];

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Building2 className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            1. Municipal Ward & Category
          </h2>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100/80 border-slate-300">
          MANDATORY REGISTRY
        </Badge>
      </div>

      {/* Ward & Zone Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-slate-800">
            Municipal Ward *
          </label>
          <Select value={selectedWardId} onValueChange={onWardSelect} disabled={loadingWards}>
            <SelectTrigger className="h-11 border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-emerald-600/20 text-[14px]">
              <SelectValue placeholder={loadingWards ? 'Loading wards...' : 'Select your Ward'} />
            </SelectTrigger>
            <SelectContent>
              {wards?.map((ward) => (
                <SelectItem key={ward.id} value={ward.id}>
                  Ward No. {ward.wardNumber} {ward.officeAddress ? `(${ward.officeAddress})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[12px] text-slate-500">
            Determines collection vehicle routing and pickup window
          </p>
          {wardError && <p className="text-[12px] font-medium text-rose-600">{wardError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-slate-800">
            Collection Zone / Tole (Optional)
          </label>
          <Select
            value={selectedZoneId || ''}
            onValueChange={(val) => onZoneSelect(val || null)}
            disabled={!selectedWardId || loadingZones}
          >
            <SelectTrigger className="h-11 border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-emerald-600/20 text-[14px]">
              <SelectValue
                placeholder={
                  !selectedWardId
                    ? 'Select ward first'
                    : loadingZones
                    ? 'Loading zones...'
                    : 'Select Collection Zone / Tole'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {zones?.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name} ({zone.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[12px] text-slate-500">
            Neighborhood cluster classification
          </p>
        </div>
      </div>

      {/* Property Classification Radio Cards */}
      <div className="space-y-2">
        <label className="block text-[13px] font-semibold text-slate-800">
          Property Classification *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {propertyCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = propertyType === cat.type;

            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => onPropertyTypeChange(cat.type)}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[92px] ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight mt-2">
                    {cat.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* House Plate Number */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-semibold text-slate-800">
          House / Building Plate No. (Optional)
        </label>
        <Input
          placeholder="e.g. Ward-3/102-K or 45/A"
          value={houseNumber || ''}
          onChange={(e) => onHouseNumberChange(e.target.value)}
          className="h-11 border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-emerald-600/20 text-[14px]"
        />
      </div>
    </Card>
  );
}

