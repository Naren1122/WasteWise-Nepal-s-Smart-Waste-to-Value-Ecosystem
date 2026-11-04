'use client';

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon path issue in Next.js/Webpack
const customPinIcon = L.divIcon({
  className: 'custom-leaflet-pin',
  html: `
    <div style="
      background-color: #16a34a;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

interface LocationMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}

// Helper component to smoothly fly/pan the map view when coordinates change (e.g. Detect GPS)
function MapViewUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 16, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [center, map]);

  return null;
}

function LocationMarker({ position, onPositionChange }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      onPositionChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const marker = e.target;
        if (marker) {
          const latlng = marker.getLatLng();
          onPositionChange(Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6)));
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      icon={customPinIcon}
    />
  );
}

interface MapPinPickerProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export default function MapPinPicker({
  latitude,
  longitude,
  onCoordinatesChange,
}: MapPinPickerProps) {
  const position: [number, number] = useMemo(() => [
    latitude && !isNaN(latitude) ? latitude : 27.7172,
    longitude && !isNaN(longitude) ? longitude : 85.324,
  ], [latitude, longitude]);

  return (
    <div className="w-full h-[280px] sm:h-[320px] rounded-lg overflow-hidden border border-slate-300 relative z-0">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewUpdater center={position} />
        <LocationMarker position={position} onPositionChange={onCoordinatesChange} />
      </MapContainer>
    </div>
  );
}
