import process from 'node:process';
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting WasteWise Database Seeding (Super Admin Only)...');

  // 1. Password Hashing (Standard strong dev password for Super Admin)
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // 2. Clean existing records in development (reverse dependency order)
  console.log('🧹 Cleaning existing data in reverse dependency order...');
  await prisma.auditLog.deleteMany({});
  await prisma.dailyAnalyticsSnapshot.deleteMany({});
  await prisma.complaintFeedback.deleteMany({});
  await prisma.complaintTimeline.deleteMany({});
  await prisma.complaintAttachment.deleteMany({});
  await prisma.complaintSubscriber.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.vehicleLocation.deleteMany({});
  await prisma.routeStop.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.scheduledPickup.deleteMany({});
  await prisma.collectionSchedule.deleteMany({});
  await prisma.bulkyWasteRequest.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.servicePlan.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.serviceZone.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.ward.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 3. Seed Platform Operator Tenant (SaaS Control Plane)
  console.log('🏛️ Creating WasteWise Platform HQ Tenant...');
  const platformTenant = await prisma.tenant.create({
    data: {
      name: 'WasteWise Platform HQ',
      subdomain: 'admin',
      province: 'Bagmati Province',
      district: 'Kathmandu',
      isActive: true,
    },
  });

  // 4. Seed Root SUPER_ADMIN (The ONLY seeded user)
  console.log('👑 Provisioning Root Super Admin...');
  const superAdmin = await prisma.user.create({
    data: {
      tenantId: platformTenant.id,
      fullName: 'System Super Admin',
      email: 'superadmin@wastewise.gov.np',
      phone: '+9779800000000',
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✨ Seeding Completed Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 ROOT SUPER ADMIN CREDENTIALS:');
  console.log(`   Tenant Subdomain: ${platformTenant.subdomain}`);
  console.log(`   Email:            ${superAdmin.email}`);
  console.log(`   Phone:            ${superAdmin.phone}`);
  console.log(`   Password:         ${defaultPassword}`);
  console.log(`   Role:             ${superAdmin.role}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('All municipal admins, staff, and citizens will now be');
  console.log('created purely through the UI according to role hierarchy.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
