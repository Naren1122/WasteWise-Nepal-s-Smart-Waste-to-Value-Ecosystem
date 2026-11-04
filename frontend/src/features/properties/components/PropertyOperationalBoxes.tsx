'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ExternalLink, Recycle } from 'lucide-react';
import { Property } from '../hooks/useProperties';

interface PropertyOperationalBoxesProps {
  property: Property;
}

export function PropertyOperationalBoxes({ property }: PropertyOperationalBoxesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Left: GPS Geofence Box */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-slate-800">
        <div className="w-8 h-8 rounded-lg bg-white border border-sky-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
          <MapPin className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12.5px] font-mono font-bold text-slate-900">
              {property.latitude.toFixed(5)}° N, {property.longitude.toFixed(5)}° E
            </span>
            <Link
              href="/tracking"
              className="text-emerald-700 hover:text-emerald-800 text-[11.5px] font-bold inline-flex items-center gap-0.5"
            >
              <span>View Map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            GPS Geofence Perimeter: Validated • 250m Bin Radius
          </p>
        </div>
      </div>

      {/* Right: Next Pickup Box */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-slate-800">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
          <Recycle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <span className="text-[12.5px] font-bold text-slate-900 block leading-tight">
            Next Pickup: Tomorrow
          </span>
          <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
            Driver: Bikram Thapa (Route #04)
          </p>
        </div>
      </div>
    </div>
  );
}

