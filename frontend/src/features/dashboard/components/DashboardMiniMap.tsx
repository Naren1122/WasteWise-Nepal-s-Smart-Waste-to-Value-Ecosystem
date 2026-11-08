'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

interface DashboardMiniMapProps {
  latitude: number;
  longitude: number;
  hubName: string;
  isActive?: boolean;
}

export default function DashboardMiniMap({
  latitude,
  longitude,
  hubName,
  isActive = false,
}: DashboardMiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const validLat = latitude && !isNaN(latitude) ? latitude : 27.7172;
  const validLng = longitude && !isNaN(longitude) ? longitude : 85.324;

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset dangling Leaflet internal ID before initializing
    if ((containerRef.current as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (containerRef.current as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    const map = L.map(containerRef.current, {
      center: [validLat, validLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Custom truck pin icon
    const truckIcon = L.divIcon({
      className: 'custom-fleet-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 rounded-full ${isActive ? 'bg-emerald-500/30 animate-ping' : 'bg-blue-500/20'}"></div>
          <div class="relative w-8 h-8 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-800'} border-2 border-white shadow-md flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([validLat, validLng], { icon: truckIcon }).addTo(map);
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center smoothly when coordinates change
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([validLat, validLng]);
      mapRef.current.panTo([validLat, validLng], { animate: true });
    }
  }, [validLat, validLng]);

  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200/90 shadow-inner group">
      {/* Underlying Leaflet Map */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Floating Top Bar Overlay */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs text-[11px] font-bold tracking-wide text-white uppercase shadow-sm flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          {hubName}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {isActive ? 'Live Fix' : 'Standby'}
        </span>
      </div>

      {/* Floating Bottom Coordinates Pill */}
      <div className="absolute bottom-2 left-2.5 right-2.5 z-10 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-white/10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-mono font-bold text-white tracking-tight">
              {validLat.toFixed(4)}° N, {validLng.toFixed(4)}° E
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">OpenStreetMap</span>
        </div>
      </div>
    </div>
  );
}

