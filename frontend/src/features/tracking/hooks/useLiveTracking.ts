'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useFleetPositions, useRouteBreadcrumbs } from '../api/tracking.api';
import type { LiveVehicleState, VehiclePositionDelta } from '../types/tracking.types';
import { useAuthStore } from '@/shared/stores/auth.store';
import { runGpsSimulation } from '../utils/tracking-simulator';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

export function useLiveTracking() {
  const { user, tenantSubdomain } = useAuthStore();
  const { data: initialVehicles = [], isLoading, refetch } = useFleetPositions();
  const [vehicles, setVehicles] = useState<LiveVehicleState[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [, startTransition] = useTransition();
  const socketRef = useRef<Socket | null>(null);

  // Sync initial query fetch into local real-time state
  useEffect(() => {
    if (initialVehicles.length > 0) {
      setVehicles((prev) => {
        if (prev.length === 0) return initialVehicles;
        // Merge without clobbering recent live GPS updates
        const updateMap = new Map(prev.map((v) => [v.vehicleId, v]));
        return initialVehicles.map((v) => updateMap.get(v.vehicleId) || v);
      });
    }
  }, [initialVehicles]);

  // Find currently selected vehicle to load its route breadcrumbs
  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId);
  const activeRouteId = selectedVehicle?.status === 'ON_ROUTE' ? selectedVehicle.routeId : null;
  const { data: breadcrumbs = [] } = useRouteBreadcrumbs(activeRouteId);

  // Establish authenticated Socket.IO connection
  useEffect(() => {
    if (!user) return;

    let token = '';
    try {
      const stored = localStorage.getItem('wastewise_tokens');
      if (stored) {
        token = JSON.parse(stored).accessToken || '';
      }
    } catch {
      // Fallback if localStorage parsing fails
    }

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join tenant operations room
      socket.emit('join:ops_room', user.tenantId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time vehicle coordinate updates streamed from backend
    socket.on('vehicle:location_update', (delta: VehiclePositionDelta) => {
      startTransition(() => {
        setVehicles((current) => {
          const index = current.findIndex((v) => v.vehicleId === delta.vehicleId);
          if (index === -1) {
            return current;
          }
          const next = [...current];
          const existing = current[index];
          if (!existing) return current;

          // Merge delta into state without wiping out metadata (Item 12)
          if (existing.status === 'ON_ROUTE') {
            next[index] = {
              ...existing,
              latitude: delta.latitude,
              longitude: delta.longitude,
              speedKmh: delta.speedKmh ?? existing.speedKmh,
              headingDeg: delta.headingDeg ?? existing.headingDeg,
              lastHeartbeat: delta.recordedAt,
              routeId: delta.routeId ?? existing.routeId,
              isStale: false,
            };
          } else {
            next[index] = {
              ...existing,
              latitude: delta.latitude,
              longitude: delta.longitude,
              lastHeartbeat: delta.recordedAt,
              isStale: false,
            };
          }
          return next;
        });
      });
    });

    return () => {
      socket.emit('leave:ops_room', user.tenantId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const simulateMovement = async () => {
    if (vehicles.length === 0 || isSimulating) return;
    const target = selectedVehicle || vehicles[0];
    if (!target) return;

    setIsSimulating(true);
    setSelectedVehicleId(target.vehicleId);

    // Call cleanly extracted, well-commented simulation runner
    await runGpsSimulation({
      targetVehicle: target,
      socket: socketRef.current,
      onWaypoint: (updatedVehicle) => {
        startTransition(() => {
          setVehicles((prev) =>
            prev.map((v) => (v.vehicleId === updatedVehicle.vehicleId ? updatedVehicle : v))
          );
        });
      },
      onComplete: () => {
        setIsSimulating(false);
      },
    });
  };

  return {
    vehicles,
    isLoading,
    isConnected,
    isSimulating,
    simulateMovement,
    selectedVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    breadcrumbs,
    refetch,
    tenantSubdomain,
  };
}

