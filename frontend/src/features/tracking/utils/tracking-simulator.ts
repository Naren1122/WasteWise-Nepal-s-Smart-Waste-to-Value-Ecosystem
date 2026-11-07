import type { Socket } from 'socket.io-client';
import type { LiveVehicleState } from '../types/tracking.types';

/**
 * ==============================================================================
 * WasteWise GPS Live Run Simulator (Development & Testing)
 * ==============================================================================
 *
 * HOW THIS WORKS:
 * 1. Simulates a waste collection truck moving through real Kathmandu streets.
 * 2. Emits real-time coordinates to Socket.IO (`telemetry:stream`) and updates local state.
 * 3. Waypoints are spaced closely along actual road corridors so the vehicle glides
 *    smoothly without jumping across city boundaries (e.g. Kathmandu vs. Lalitpur).
 *
 * HOW YOU CAN MODIFY THIS LATER:
 * - Change the street waypoints in `KMC_WARD_1_SIMULATION_ROUTE` below.
 * - Add new routes for other wards or cities (e.g. Pokhara, Lalitpur).
 * - Change `STEP_INTERVAL_MS` to speed up or slow down the driving pace.
 * - Change `speedKmh` or `headingDeg` to match simulated vehicle behavior.
 * ==============================================================================
 */

export interface GpsWaypoint {
  lat: number;
  lng: number;
  speedKmh: number;
  headingDeg: number;
  streetName: string;
}

/**
 * Default Route: Ward 1 (Naxal -> Baluwatar -> Police HQ -> Teaching Hospital)
 * Notice coordinates follow a continuous street path (latitude ~27.717 to 27.733, longitude ~85.324 to 85.330)
 * Spaced by ~100-200 meters for smooth street-level movement.
 */
export const KMC_WARD_1_SIMULATION_ROUTE: GpsWaypoint[] = [
  { lat: 27.7172, lng: 85.3240, speedKmh: 20, headingDeg: 45, streetName: 'Naxal Bhagwati Marg' },
  { lat: 27.7188, lng: 85.3248, speedKmh: 26, headingDeg: 40, streetName: 'Naxal Police Headquarters' },
  { lat: 27.7205, lng: 85.3259, speedKmh: 30, headingDeg: 35, streetName: 'Baluwatar Road' },
  { lat: 27.7228, lng: 85.3271, speedKmh: 32, headingDeg: 30, streetName: 'Baluwatar Chowk' },
  { lat: 27.7252, lng: 85.3283, speedKmh: 28, headingDeg: 25, streetName: 'Prime Minister Residence Gate' },
  { lat: 27.7275, lng: 85.3292, speedKmh: 30, headingDeg: 20, streetName: 'Russian Embassy Corridor' },
  { lat: 27.7300, lng: 85.3299, speedKmh: 25, headingDeg: 15, streetName: 'Lazimpat North' },
  { lat: 27.7328, lng: 85.3306, speedKmh: 22, headingDeg: 10, streetName: 'Teaching Hospital Avenue' },
  { lat: 27.7355, lng: 85.3314, speedKmh: 18, headingDeg: 5, streetName: 'Maharajgunj Ring Road' },
];

/**
 * Driving speed: Time in milliseconds to pause between each waypoint.
 * - Set to 1500–2000 ms for smooth real-time visualization.
 * - Lower values (e.g. 500 ms) will make the truck move faster.
 */
export const SIMULATION_STEP_INTERVAL_MS = 1800;

export interface RunSimulationOptions {
  targetVehicle: LiveVehicleState;
  socket: Socket | null;
  onWaypoint: (updatedVehicle: LiveVehicleState) => void;
  onComplete: () => void;
  customRoute?: GpsWaypoint[];
}

/**
 * Executes a simulated GPS run along Kathmandu streets.
 * Call this function to start streaming coordinates.
 */
export async function runGpsSimulation({
  targetVehicle,
  socket,
  onWaypoint,
  onComplete,
  customRoute = KMC_WARD_1_SIMULATION_ROUTE,
}: RunSimulationOptions): Promise<() => void> {
  let isCancelled = false;

  // Provide a cancel function so user can stop the simulation early
  const cancel = () => {
    isCancelled = true;
  };

  (async () => {
    for (let i = 0; i < customRoute.length; i++) {
      if (isCancelled) break;

      const pt = customRoute[i];
      if (!pt) continue;

      const timestamp = new Date().toISOString();

      // 1. Broadcast telemetry to backend via Socket.IO
      if (socket?.connected) {
        socket.emit('telemetry:stream', {
          vehicleId: targetVehicle.vehicleId,
          routeId: targetVehicle.status === 'ON_ROUTE' ? targetVehicle.routeId : undefined,
          latitude: pt.lat,
          longitude: pt.lng,
          speedKmh: pt.speedKmh,
          headingDeg: pt.headingDeg,
          recordedAt: timestamp,
        });
      }

      // 2. Update local state
      const updatedVehicle: LiveVehicleState = {
        status: 'ON_ROUTE',
        vehicleId: targetVehicle.vehicleId,
        registrationNo: targetVehicle.registrationNo,
        driverName: targetVehicle.driverName || 'Ram Bahadur (KMC Route Driver)',
        routeId: targetVehicle.status === 'ON_ROUTE' ? targetVehicle.routeId : 'sim-route',
        wasteType: targetVehicle.status === 'ON_ROUTE' ? targetVehicle.wasteType : 'ORGANIC',
        latitude: pt.lat,
        longitude: pt.lng,
        speedKmh: pt.speedKmh,
        headingDeg: pt.headingDeg,
        lastHeartbeat: timestamp,
      };

      onWaypoint(updatedVehicle);

      // Wait between GPS steps
      await new Promise((resolve) => setTimeout(resolve, SIMULATION_STEP_INTERVAL_MS));
    }

    onComplete();
  })();

  return cancel;
}
