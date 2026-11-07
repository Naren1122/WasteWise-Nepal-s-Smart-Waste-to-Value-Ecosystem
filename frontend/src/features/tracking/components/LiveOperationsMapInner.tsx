'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LiveVehicleState, RouteBreadcrumb } from '../types/tracking.types';

interface LiveOperationsMapInnerProps {
  vehicles: LiveVehicleState[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  breadcrumbs?: RouteBreadcrumb[];
}

function createTruckIcon(vehicle: LiveVehicleState, isSelected: boolean): L.DivIcon {
  const isOnRoute = vehicle.status === 'ON_ROUTE';
  const bgColor = isOnRoute ? '#059669' : vehicle.status === 'MAINTENANCE' ? '#d97706' : '#64748b';
  const heading = vehicle.status === 'ON_ROUTE' ? vehicle.headingDeg : 0;
  const pulseHtml = isOnRoute ? '<div class="absolute -inset-1.5 rounded-full bg-emerald-400/40 animate-ping"></div>' : '';
  const selectedRing = isSelected ? 'ring-4 ring-emerald-500/80 scale-110 shadow-lg' : 'shadow-md';

  const html = `
    <div class="relative flex items-center justify-center transition-transform duration-300">
      ${pulseHtml}
      <div style="background-color: ${bgColor};" class="relative w-9 h-9 rounded-full border-2 border-white flex items-center justify-center ${selectedRing}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${heading}deg); transition: transform 0.4s ease;">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-truck-icon',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function MapViewController({
  selectedVehicle,
}: {
  selectedVehicle?: LiveVehicleState;
}) {
  const map = useMap();
  const lastVehicleIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!selectedVehicle?.latitude || !selectedVehicle?.longitude) return;

    const lat = selectedVehicle.latitude;
    const lng = selectedVehicle.longitude;
    const isNewVehicle = lastVehicleIdRef.current !== selectedVehicle.vehicleId;
    lastVehicleIdRef.current = selectedVehicle.vehicleId;

    if (isNewVehicle) {
      // First time selecting this vehicle: smoothly pan to street level without zooming out to the entire valley
      map.setView([lat, lng], 15, { animate: true });
    } else {
      // Continuous GPS update: only gently pan if the truck moves near the edge of the viewport
      const currentBounds = map.getBounds();
      if (!currentBounds.pad(-0.1).contains([lat, lng])) {
        map.panTo([lat, lng], { animate: true, duration: 0.6 });
      }
    }
  }, [selectedVehicle, map]);

  return null;
}

export default function LiveOperationsMapInner({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  breadcrumbs = [],
}: LiveOperationsMapInnerProps) {
  const defaultCenter: [number, number] = [27.7172, 85.324]; // Kathmandu Center

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.vehicleId === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );

  const polylineCoords: [number, number][] = useMemo(() => {
    return breadcrumbs.map((b) => [b.latitude, b.longitude]);
  }, [breadcrumbs]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm z-0">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController selectedVehicle={selectedVehicle} />

        {/* Route History Breadcrumb Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#059669',
              weight: 4,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Live Truck Markers */}
        {vehicles.map((v) => {
          if (!v.latitude || !v.longitude) return null;
          const isSelected = v.vehicleId === selectedVehicleId;
          const icon = createTruckIcon(v, isSelected);

          return (
            <Marker
              key={v.vehicleId}
              position={[v.latitude, v.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectVehicle(v.vehicleId),
              }}
            >
              <Popup className="rounded-xl font-sans">
                <div className="p-1 space-y-1 text-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-[14px] text-slate-900">{v.registrationNo}</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        v.status === 'ON_ROUTE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>
                  {v.driverName && (
                    <div className="text-[12px] text-slate-600">
                      Driver: <span className="font-medium text-slate-800">{v.driverName}</span>
                    </div>
                  )}
                  {v.status === 'ON_ROUTE' && (
                    <div className="flex items-center gap-3 text-[11.5px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Speed: <b className="text-slate-800">{v.speedKmh.toFixed(0)} km/h</b></span>
                      <span>Heading: <b className="text-slate-800">{v.headingDeg}°</b></span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

