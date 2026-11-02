import process from 'node:process';
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting WasteWise Multi-Tenant Database Seeding...');

  // 1. Password Hashing (Standard strong dev password for all seeded accounts)
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // 2. Clean existing records in development (order matters due to foreign keys)
  console.log('🧹 Cleaning existing data...');
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

  const ward1Kmc = kmcTenant.wards.find((w) => w.wardNumber === 1);
  const ward32Kmc = kmcTenant.wards.find((w) => w.wardNumber === 32);

  // KMC Users (Admin, Staff, Citizen)
  await prisma.user.createMany({
    data: [
      {
        tenantId: kmcTenant.id,
        fullName: 'KMC Municipal Administrator',
        email: 'admin@kathmandu.gov.np',
        phone: '+9779851000001',
        passwordHash,
        role: Role.MUNICIPAL_ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        wardId: ward1Kmc ? ward1Kmc.id : null,
        fullName: 'Suman Shrestha (Ward 1 Officer)',
        email: 'ward1@kathmandu.gov.np',
        phone: '+9779851000002',
        passwordHash,
        role: Role.WARD_OFFICER,
        status: UserStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        wardId: null,
        fullName: 'Ram Bahadur (KMC Route Driver)',
        email: 'driver1@kathmandu.gov.np',
        phone: '+9779851000003',
        passwordHash,
        role: Role.DRIVER,
        status: UserStatus.ACTIVE,
      },
      {
        tenantId: kmcTenant.id,
        wardId: ward32Kmc ? ward32Kmc.id : null,
        fullName: 'Aayush Adhikari (Citizen)',
        email: 'citizen.kmc@example.com',
        phone: '+9779841234567',
        passwordHash,
        role: Role.CITIZEN,
        status: UserStatus.ACTIVE,
      },
    ],
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

  const ward2Lmc = lmcTenant.wards.find((w) => w.wardNumber === 2);

  // LMC Users (Admin, Citizen)
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
        wardId: ward2Lmc ? ward2Lmc.id : null,
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

