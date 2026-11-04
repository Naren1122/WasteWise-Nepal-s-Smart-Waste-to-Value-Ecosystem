'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { MapPin, Navigation, Eye, EyeOff, Loader2 } from 'lucide-react';
import { PropertyFormData } from '../types/property-form.schema';
import { reverseGeocode } from '../../../shared/utils/geocoding';

// Lazy-load Leaflet Map to ensure zero SSR latency and strict Code Splitting (GEMINI.md Rule 6.2)
const DynamicMapPinPicker = dynamic(() => import('./MapPinPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] sm:h-[320px] rounded-lg bg-slate-100 flex flex-col items-center justify-center gap-2 border border-slate-200">
      <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-[13px] text-slate-500 font-medium">Loading Map View...</span>
    </div>
  ),
});

interface GpsLocationInputProps {
  register: UseFormRegister<PropertyFormData>;
  setValue: UseFormSetValue<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
  latitude?: number;
  longitude?: number;
  onDetectError?: (msg: string) => void;
}

export function GpsLocationInput({
  register,
  setValue,
  errors,
  latitude,
  longitude,
  onDetectError,
}: GpsLocationInputProps) {
  const [showInteractiveMap, setShowInteractiveMap] = useState<boolean>(true);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  // Helper to fetch and auto-fill street address when location changes
  const updateAddressFromCoords = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    if (address) {
      setValue('streetAddress', address, { shouldValidate: true });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (onDetectError) {
        onDetectError('Geolocation is not supported by your browser. Please drag the pin on the map.');
      }
      return;
    }

    setIsDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        // 1. Automatically set latitude & longitude
        setValue('latitude', lat, { shouldValidate: true });
        setValue('longitude', lng, { shouldValidate: true });

        // 2. Automatically detect and set street address via reverse geocoding
        await updateAddressFromCoords(lat, lng);
        setIsDetectingGps(false);
      },
      (error) => {
        setIsDetectingGps(false);
        let msg = 'Unable to retrieve your current location. Please click on the map to set your pin.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser or click on the map.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again or drag the pin on the map.';
        }
        if (onDetectError) onDetectError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleMapCoordinateChange = async (lat: number, lng: number) => {
    setValue('latitude', lat, { shouldValidate: true });
    setValue('longitude', lng, { shouldValidate: true });
    // Also auto-suggest street address when clicking/dragging map pin
    await updateAddressFromCoords(lat, lng);
  };

  const currentLat = latitude && !isNaN(latitude) ? latitude : 27.7172;
  const currentLng = longitude && !isNaN(longitude) ? longitude : 85.324;

  return (
    <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      {/* Header with GPS controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Premises Location (Interactive Map & GPS Pin)
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setShowInteractiveMap((prev) => !prev)}
            className="flex items-center gap-1.5 h-10 px-3.5"
          >
            {showInteractiveMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showInteractiveMap ? 'Hide Map' : 'Show Map'}</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={handleGetCurrentLocation}
            disabled={isDetectingGps}
            className="flex items-center gap-1.5 h-10 px-4"
          >
            {isDetectingGps ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Detect My GPS</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code-Split Lazy Loaded Interactive Leaflet Map */}
      {showInteractiveMap && (
        <div className="pt-1">
          <DynamicMapPinPicker
            latitude={currentLat}
            longitude={currentLng}
            onCoordinatesChange={handleMapCoordinateChange}
          />
          <p className="text-[12px] text-slate-500 mt-1.5">
            💡 <strong>Tip:</strong> Click anywhere on the map or drag the pin. It will automatically update your <strong>coordinates and street address</strong>!
          </p>
        </div>
      )}

      {/* Explicit Numeric Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Input
          type="number"
          step="0.000001"
          label="Latitude *"
          placeholder="27.717200"
          error={errors.latitude?.message}
          {...register('latitude', { valueAsNumber: true })}
        />
        <Input
          type="number"
          step="0.000001"
          label="Longitude *"
          placeholder="85.324000"
          error={errors.longitude?.message}
          {...register('longitude', { valueAsNumber: true })}
        />
      </div>

      <p className="text-[12px] text-slate-500 font-mono">
        Active Pin: {currentLat.toFixed(6)}, {currentLng.toFixed(6)} (Valid Nepal Region)
      </p>
    </div>
  );
}
