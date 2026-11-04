'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  MapPin,
  Navigation,
  RotateCcw,
  Compass,
  Radio,
} from 'lucide-react';
import { reverseGeocode } from '@/shared/utils/geocoding';

const DynamicMapPinPicker = dynamic(() => import('./MapPinPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-2 border border-slate-200">
      <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-[13px] text-slate-500 font-medium">Loading Municipal Map...</span>
    </div>
  ),
});

interface GpsMapCardProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onAddressDetected?: (address: string) => void;
  onDetectError?: (msg: string) => void;
}

export function GpsMapCard({
  latitude,
  longitude,
  onCoordinatesChange,
  onAddressDetected,
  onDetectError,
}: GpsMapCardProps) {
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (onDetectError) onDetectError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onCoordinatesChange(lat, lng);

        const addr = await reverseGeocode(lat, lng);
        if (addr && onAddressDetected) {
          onAddressDetected(addr);
        }
        setIsDetecting(false);
      },
      (err) => {
        setIsDetecting(false);
        let msg = 'Could not retrieve your current location. Please drag or click the pin on the map.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please click on the map to set your premises pin.';
        }
        if (onDetectError) onDetectError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleReset = () => {
    onCoordinatesChange(27.7172, 85.324);
  };

  const handleMapCoordChange = async (lat: number, lng: number) => {
    onCoordinatesChange(lat, lng);
    const addr = await reverseGeocode(lat, lng);
    if (addr && onAddressDetected) {
      onAddressDetected(addr);
    }
  };

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Premises Location & GPS Pin
            </h2>
            <p className="text-[12px] text-slate-500">Real-time geofence mapping</p>
          </div>
        </div>
        <Badge variant="active" className="text-[10px] font-bold tracking-wider">
          Live Geofence
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="primary"
          onClick={handleGetCurrentLocation}
          isLoading={isDetecting}
          className="h-10 text-[13px] font-bold bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Detect My GPS</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="h-10 text-[13px] font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Geotag</span>
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner">
        {/* Floating Pin Tooltip */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-slate-950/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-tight shadow-md flex items-center gap-1.5 border border-white/10 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Premises Pin: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
        </div>

        {/* Floating Ward Geofence Label */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-slate-300 shadow-2xs pointer-events-none">
          WARD 03 BOUNDARY
        </div>

        <div className="absolute bottom-3 right-3 z-10 text-[10px] font-semibold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded pointer-events-none">
          KMC Cadastral Base v4.2
        </div>

        <DynamicMapPinPicker
          latitude={latitude}
          longitude={longitude}
          onCoordinatesChange={handleMapCoordChange}
        />
      </div>

      {/* Coordinate & GIS Precision Status Ribbon */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            LATITUDE
          </span>
          <span className="text-[12px] font-mono font-bold text-slate-900 mt-0.5 block truncate">
            {latitude.toFixed(6)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            LONGITUDE
          </span>
          <span className="text-[12px] font-mono font-bold text-slate-900 mt-0.5 block truncate">
            {longitude.toFixed(6)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            GIS PRECISION
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>± 3.2m</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

