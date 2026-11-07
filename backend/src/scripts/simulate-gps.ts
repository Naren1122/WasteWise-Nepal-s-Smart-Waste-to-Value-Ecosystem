import { prisma } from '../shared/database/prisma.service.js';
import { trackingGateway } from '../features/tracking/tracking.gateway.js';
import { TrackingService } from '../features/tracking/tracking.service.js';
import { RouteStatus, VehicleStatus } from '@prisma/client';

/**
 * WasteWise GPS Live Run Simulator for Development & Testing
 * Streams sequential realistic GPS points along Kathmandu streets.
 */
async function runGpsSimulation(): Promise<void> {
  console.log('🚀 Initializing WasteWise GPS Run Simulator...');

  // 1. Find or pick the first vehicle in the database
  const vehicle = await prisma.vehicle.findFirst({
    include: { tenant: true, assignedDriver: true },
  });

  if (!vehicle) {
    console.error('❌ No vehicles found in database. Please run npm run prisma:seed first.');
    process.exit(1);
  }

  const tenantId = vehicle.tenantId;
  const vehicleId = vehicle.id;
  const driverId = vehicle.assignedDriverId || (await prisma.user.findFirst({ where: { tenantId, role: 'DRIVER' } }))?.id;

  if (!driverId) {
    console.error('❌ No driver found for this vehicle/tenant.');
    process.exit(1);
  }

  // 2. Ensure an active IN_PROGRESS route exists for this driver and vehicle so Shift-Boundary Guard passes
  let activeRoute = await prisma.route.findFirst({
    where: {
      tenantId,
      vehicleId,
      driverId,
      status: RouteStatus.IN_PROGRESS,
    },
  });

  if (!activeRoute) {
    console.log(`📦 Creating and starting active collection route for ${vehicle.registrationNo}...`);
    const ward = await prisma.ward.findFirst({ where: { tenantId } });
    if (!ward) {
      console.error('❌ No ward found.');
      process.exit(1);
    }

    activeRoute = await prisma.route.create({
      data: {
        tenantId,
        wardId: ward.id,
        vehicleId,
        driverId,
        routeDate: new Date(),
        wasteType: 'ORGANIC',
        status: RouteStatus.IN_PROGRESS,
        startTime: new Date(),
        notes: 'Live GPS Simulation Run',
      },
    });

    // Update vehicle to ON_ROUTE
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.ON_ROUTE, assignedDriverId: driverId },
    });
  }

  console.log(`✅ Active route verified: ${activeRoute.id} (Status: IN_PROGRESS)`);
  console.log(`🚚 Streaming live GPS coordinates for Vehicle: ${vehicle.registrationNo}`);
  console.log(`📡 Open your browser at http://localhost:3000/tracking to watch it live!\n`);

  // 3. Realistic Kathmandu GPS waypoints: Naxal -> Baluwatar -> Maharajgunj
  const waypoints = [
    { lat: 27.7172, lng: 85.3240, speed: 22, heading: 45, name: 'Naxal Bhagwati' },
    { lat: 27.7195, lng: 85.3252, speed: 28, heading: 40, name: 'Naxal Chowk' },
    { lat: 27.7220, lng: 85.3268, speed: 32, heading: 35, name: 'Baluwatar Road' },
    { lat: 27.7255, lng: 85.3282, speed: 35, heading: 30, name: 'Baluwatar Prime Minister Gate' },
    { lat: 27.7290, lng: 85.3295, speed: 30, heading: 25, name: 'Lazimpat Junction' },
    { lat: 27.7325, lng: 85.3308, speed: 25, heading: 20, name: 'Teaching Hospital Avenue' },
    { lat: 27.7360, lng: 85.3315, speed: 18, heading: 10, name: 'Maharajgunj Ring Road' },
  ];

  const trackingService = new TrackingService();

  for (let i = 0; i < waypoints.length; i++) {
    const pt = waypoints[i]!;
    console.log(`[GPS Step ${i + 1}/${waypoints.length}] 📍 ${pt.name} -> Lat: ${pt.lat}, Lng: ${pt.lng}, Speed: ${pt.speed} km/h`);

    // Ingest location through domain service (enforces guard, throttling & Redis cache)
    const result = await trackingService.ingestLocation(tenantId, driverId, {
      vehicleId,
      routeId: activeRoute.id,
      latitude: pt.lat,
      longitude: pt.lng,
      speedKmh: pt.speed,
      headingDeg: pt.heading,
      recordedAt: new Date().toISOString(),
    });

    // Broadcast live delta event via Socket.IO gateway to connected frontend clients (Item 12)
    trackingGateway.broadcastToOps(tenantId, {
      vehicleId,
      routeId: activeRoute.id,
      latitude: pt.lat,
      longitude: pt.lng,
      speedKmh: pt.speed,
      headingDeg: pt.heading,
      recordedAt: new Date().toISOString(),
    });

    if (activeRoute.id) {
      trackingGateway.broadcastToRoute(activeRoute.id, {
        vehicleId,
        routeId: activeRoute.id,
        latitude: pt.lat,
        longitude: pt.lng,
        headingDeg: pt.heading,
        recordedAt: result.telemetry.recordedAt,
      });
    }

    // Wait 2.5 seconds between GPS points
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  console.log('\n🎉 GPS Simulation Run completed successfully!');
  console.log('Truck telemetry and breadcrumb history saved to database & Redis.');
  await prisma.$disconnect();
  process.exit(0);
}

runGpsSimulation().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});

