'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ComplaintMapPickerProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export default function ComplaintMapPicker({
  latitude,
  longitude,
  onCoordinatesChange,
}: ComplaintMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset any dangling Leaflet internal ID before initializing
    if ((containerRef.current as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (containerRef.current as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    const pinIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div style="
          background-color: #059669;
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 9px;
            height: 9px;
            background-color: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const initialLat = latitude && !isNaN(latitude) ? latitude : 27.7172;
    const initialLng = longitude && !isNaN(longitude) ? longitude : 85.324;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onCoordinatesChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onCoordinatesChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Pan map and reposition marker when coordinates change externally (e.g. GPS button)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const currentPos = markerRef.current.getLatLng();
    if (
      Math.abs(currentPos.lat - latitude) > 0.00001 ||
      Math.abs(currentPos.lng - longitude) > 0.00001
    ) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.flyTo([latitude, longitude], 16, { duration: 1 });
    }
  }, [latitude, longitude]);

  return (
    <div className="w-full h-[220px] sm:h-[260px] rounded-lg overflow-hidden border border-slate-300 relative z-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

