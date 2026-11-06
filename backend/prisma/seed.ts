import process from 'node:process';
import { PrismaClient, Role, UserStatus, WasteType, PropertyType, PropertyStatus, SubscriptionStatus, VehicleType, VehicleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting WasteWise Multi-Tenant Database Seeding...');

  // 1. Password Hashing (Standard strong dev password for all seeded accounts)
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // 2. Clean existing records in development (reverse dependency order)
  console.log('🧹 Cleaning existing data...');
  await prisma.routeStop.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.bulkyWasteRequest.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.servicePlan.deleteMany({});
  await prisma.collectionSchedule.deleteMany({});
  await prisma.serviceZone.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.ward.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 3. Seed Tenant 1: Kathmandu Metropolitan City (KMC)
  console.log('🏛️ Seeding Kathmandu Metropolitan City...');
  const kmcTenant = await prisma.tenant.create({
    data: {
      name: 'Kathmandu Metropolitan City',
      subdomain: 'kathmandu',
      province: 'Bagmati Province',
      district: 'Kathmandu',
      isActive: true,
      wards: {
        create: [
          {
            wardNumber: 1,
            officeAddress: 'Naxal, Kathmandu',
            contactPhone: '+977-01-4412345',
          },
          {
            wardNumber: 3,
            officeAddress: 'Maharajgunj, Kathmandu',
            contactPhone: '+977-01-4721234',
          },
          {
            wardNumber: 4,
            officeAddress: 'Baluwatar, Kathmandu',
            contactPhone: '+977-01-4435678',
          },
          {
            wardNumber: 32,
            officeAddress: 'Koteshwor, Kathmandu',
            contactPhone: '+977-01-4601122',
          },
        ],
      },
    },
    include: {
      wards: true,
    },
  });

  const ward1Kmc = kmcTenant.wards.find((w) => w.wardNumber === 1)!;
  const ward3Kmc = kmcTenant.wards.find((w) => w.wardNumber === 3)!;
  const ward4Kmc = kmcTenant.wards.find((w) => w.wardNumber === 4)!;
  const ward32Kmc = kmcTenant.wards.find((w) => w.wardNumber === 32)!;

  // KMC Users
  const kmcAdmin = await prisma.user.create({
    data: {
      tenantId: kmcTenant.id,
      fullName: 'KMC Municipal Administrator',
      email: 'admin@kathmandu.gov.np',
      phone: '+9779851000001',
      passwordHash,
      role: Role.MUNICIPAL_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: kmcTenant.id,
      wardId: ward1Kmc.id,
      fullName: 'Suman Shrestha (Ward 1 Officer)',
      email: 'ward1@kathmandu.gov.np',
      phone: '+9779851000002',
      passwordHash,
      role: Role.WARD_OFFICER,
      status: UserStatus.ACTIVE,
    },
  });

  const kmcDriver = await prisma.user.create({
    data: {
      tenantId: kmcTenant.id,
      wardId: null,
      fullName: 'Ram Bahadur (KMC Route Driver)',
      email: 'driver1@kathmandu.gov.np',
      phone: '+9779851000003',
      passwordHash,
      role: Role.DRIVER,
      status: UserStatus.ACTIVE,
    },
  });

  const kmcCitizen = await prisma.user.create({
    data: {
      tenantId: kmcTenant.id,
      wardId: ward32Kmc.id,
      fullName: 'Aayush Adhikari (Citizen)',
      email: 'citizen.kmc@example.com',
      phone: '+9779841234567',
      passwordHash,
      role: Role.CITIZEN,
      status: UserStatus.ACTIVE,
    },
  });

  // KMC Service Plans
  console.log('📋 Seeding KMC Service Plans...');
  const organicPlan = await prisma.servicePlan.create({
    data: {
      tenantId: kmcTenant.id,
      name: 'Residential Organic Waste Collection',
      code: 'KMC-RES-ORG',
      description: 'Daily biodegradable kitchen and garden waste collection',
      propertyType: PropertyType.RESIDENTIAL,
      wasteType: WasteType.ORGANIC,
      monthlyRateNpr: 450,
      isActive: true,
    },
  });

  const recyclablePlan = await prisma.servicePlan.create({
    data: {
      tenantId: kmcTenant.id,
      name: 'Residential Recyclables Collection',
      code: 'KMC-RES-REC',
      description: 'Bi-weekly paper, plastics, and metals collection',
      propertyType: PropertyType.RESIDENTIAL,
      wasteType: WasteType.RECYCLABLE,
      monthlyRateNpr: 350,
      isActive: true,
    },
  });

  const hazardousPlan = await prisma.servicePlan.create({
    data: {
      tenantId: kmcTenant.id,
      name: 'Hazardous & E-Waste Special Pickup',
      code: 'KMC-RES-HAZ',
      description: 'Batteries, electronics, medical waste safe disposal',
      propertyType: PropertyType.RESIDENTIAL,
      wasteType: WasteType.HAZARDOUS,
      monthlyRateNpr: 600,
      isActive: true,
    },
  });

  // KMC Properties & Subscriptions across Wards
  console.log('🏠 Seeding KMC Properties and Subscriptions...');
  const propWard1 = await prisma.property.create({
    data: {
      tenantId: kmcTenant.id,
      wardId: ward1Kmc.id,
      userId: kmcCitizen.id,
      propertyType: PropertyType.RESIDENTIAL,
      status: PropertyStatus.ACTIVE,
      houseNumber: '12B',
      streetAddress: 'Naxal Bhagwati Marg',
      latitude: 27.7172,
      longitude: 85.324,
      contactName: 'Aayush Adhikari',
      contactPhone: '+9779841234567',
    },
  });

  const propWard32A = await prisma.property.create({
    data: {
      tenantId: kmcTenant.id,
      wardId: ward32Kmc.id,
      userId: kmcCitizen.id,
      propertyType: PropertyType.RESIDENTIAL,
      status: PropertyStatus.ACTIVE,
      houseNumber: '8A',
      streetAddress: 'Koteshwor Chowk',
      latitude: 27.678,
      longitude: 85.348,
      contactName: 'Aayush Adhikari',
      contactPhone: '+9779841234567',
    },
  });

  const propWard32B = await prisma.property.create({
    data: {
      tenantId: kmcTenant.id,
      wardId: ward32Kmc.id,
      userId: kmcCitizen.id,
      propertyType: PropertyType.RESIDENTIAL,
      status: PropertyStatus.ACTIVE,
      houseNumber: '15',
      streetAddress: 'Jadibuti Marg',
      latitude: 27.675,
      longitude: 85.352,
      contactName: 'Aayush Adhikari',
      contactPhone: '+9779841234567',
    },
  });

  // Subscriptions linking properties to plans
  await prisma.subscription.createMany({
    data: [
      {
        tenantId: kmcTenant.id,
        propertyId: propWard1.id,
        planId: organicPlan.id,
        userId: kmcCitizen.id,
        status: SubscriptionStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        propertyId: propWard32A.id,
        planId: organicPlan.id,
        userId: kmcCitizen.id,
        status: SubscriptionStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        propertyId: propWard32A.id,
        planId: hazardousPlan.id,
        userId: kmcCitizen.id,
        status: SubscriptionStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        propertyId: propWard32B.id,
        planId: organicPlan.id,
        userId: kmcCitizen.id,
        status: SubscriptionStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        propertyId: propWard32B.id,
        planId: recyclablePlan.id,
        userId: kmcCitizen.id,
        status: SubscriptionStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        propertyId: propWard32B.id,
        planId: hazardousPlan.id,
        userId: kmcCitizen.id,
        status: SubscriptionStatus.ACTIVE,
      },
    ],
  });

  // Seed Fleet Vehicle in KMC
  console.log('🚛 Seeding Fleet Vehicles...');
  await prisma.vehicle.create({
    data: {
      tenantId: kmcTenant.id,
      registrationNo: 'BA-1-KHA-4029',
      vehicleType: VehicleType.COMPACTOR,
      capacityKg: 5000,
      fuelType: 'DIESEL',
      status: VehicleStatus.AVAILABLE,
      assignedDriverId: kmcDriver.id,
      notes: 'Primary morning compactor for KMC central wards',
    },
  });

  // 4. Seed Tenant 2: Lalitpur Metropolitan City (LMC)
  console.log('🏛️ Seeding Lalitpur Metropolitan City...');
  const lmcTenant = await prisma.tenant.create({
    data: {
      name: 'Lalitpur Metropolitan City',
      subdomain: 'lalitpur',
      province: 'Bagmati Province',
      district: 'Lalitpur',
      isActive: true,
      wards: {
        create: [
          {
            wardNumber: 2,
            officeAddress: 'Sanepa, Lalitpur',
            contactPhone: '+977-01-5523456',
          },
          {
            wardNumber: 5,
            officeAddress: 'Jawalakhel, Lalitpur',
            contactPhone: '+977-01-5534567',
          },
        ],
      },
    },
    include: {
      wards: true,
    },
  });

  const ward2Lmc = lmcTenant.wards.find((w) => w.wardNumber === 2)!;

  await prisma.user.createMany({
    data: [
      {
        tenantId: lmcTenant.id,
        wardId: null,
        fullName: 'LMC Municipal Administrator',
        email: 'admin@lalitpur.gov.np',
        phone: '+9779851100001',
        passwordHash,
        role: Role.MUNICIPAL_ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        tenantId: lmcTenant.id,
        wardId: ward2Lmc.id,
        fullName: 'Bikash Maharjan (Citizen)',
        email: 'citizen.lmc@example.com',
        phone: '+9779841987654',
        passwordHash,
        role: Role.CITIZEN,
        status: UserStatus.ACTIVE,
      },
    ],
  });

  console.log('✅ WasteWise Database Seeding completed successfully!');
  console.log('---------------------------------------------------------');
  console.log('Default Password for all seeded accounts: Password123!');
  console.log('Seeded Tenants:');
  console.log('  1. Subdomain: kathmandu | Admin: admin@kathmandu.gov.np');
  console.log('  2. Subdomain: lalitpur  | Admin: admin@lalitpur.gov.np');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
