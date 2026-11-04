'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Search } from 'lucide-react';
import { Ward } from '../hooks/useProperties';

interface PropertiesFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedWardId: string;
  onWardChange: (wardId: string) => void;
  wards?: Ward[];
}

export function PropertiesFilterBar({
  searchQuery,
  onSearchChange,
  selectedWardId,
  onWardChange,
  wards,
}: PropertiesFilterBarProps) {
  return (
    <Card className="p-3 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search premises by street address, building plate, or contact person..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-10 border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/20 text-[13.5px] bg-slate-50/50"
          />
        </div>

        {/* Ward Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            WARD:
          </span>
          <Select value={selectedWardId} onValueChange={onWardChange}>
            <SelectTrigger className="h-10 w-full sm:w-[200px] border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/20 text-[13px] bg-slate-50/70 font-semibold text-slate-800">
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Wards (Active)</SelectItem>
              {wards?.map((ward) => (
                <SelectItem key={ward.id} value={ward.id}>
                  Ward No. {ward.wardNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

