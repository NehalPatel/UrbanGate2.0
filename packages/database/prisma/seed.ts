/**
 * Demo seeder — wipes all UrbanGate collections and inserts a known dataset.
 *
 * Usage (from repo root, with DATABASE_URL set / .env loaded):
 *   pnpm db:seed
 *   pnpm db:reset   # push schema + seed
 *
 * Demo login (password for all): Password123!
 *   admin@urbangate.demo      — platform + society admin
 *   treasurer@urbangate.demo  — treasurer
 *   owner1@urbangate.demo     — unit owner (A-101)
 */

import 'dotenv/config';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

/** Store money as integer paise (1 INR = 100 paise). */
function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Password123!';

async function wipe() {
  // Child collections first
  await prisma.servicePersonnelUnit.deleteMany();
  await prisma.servicePersonnel.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.amenityBooking.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.gate.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.billingRun.deleteMany();
  await prisma.maintenanceRuleVersion.deleteMany();
  await prisma.maintenanceRule.deleteMany();
  await prisma.unitRelationship.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.societyMembership.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.society.deleteMany();
  await prisma.user.deleteMany();
  await prisma.healthCheck.deleteMany();
}

async function hash(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

async function seed() {
  console.log('Wiping database…');
  await wipe();

  console.log('Seeding demo data…');
  const passwordHash = await hash(DEMO_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@urbangate.demo',
      name: 'Demo Admin',
      passwordHash,
      isPlatformAdmin: true,
      status: 'ACTIVE',
    },
  });

  const treasurer = await prisma.user.create({
    data: {
      email: 'treasurer@urbangate.demo',
      name: 'Demo Treasurer',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const owner1 = await prisma.user.create({
    data: {
      email: 'owner1@urbangate.demo',
      name: 'Riya Sharma',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: 'owner2@urbangate.demo',
      name: 'Amit Patel',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const guard = await prisma.user.create({
    data: {
      email: 'guard@urbangate.demo',
      name: 'Gate Guard',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const society = await prisma.society.create({
    data: {
      name: 'Green Valley Residency',
      slug: 'green-valley',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      currency: 'INR',
    },
  });

  await prisma.societyMembership.createMany({
    data: [
      {
        societyId: society.id,
        userId: admin.id,
        roleKeys: ['SOCIETY_ADMIN'],
        status: 'active',
      },
      {
        societyId: society.id,
        userId: treasurer.id,
        roleKeys: ['TREASURER', 'ACCOUNTANT'],
        status: 'active',
      },
      {
        societyId: society.id,
        userId: owner1.id,
        roleKeys: ['OWNER'],
        status: 'active',
      },
      {
        societyId: society.id,
        userId: owner2.id,
        roleKeys: ['OWNER'],
        status: 'active',
      },
      {
        societyId: society.id,
        userId: guard.id,
        roleKeys: ['SECURITY_GUARD'],
        status: 'active',
      },
    ],
  });

  const wingA = await prisma.building.create({
    data: { societyId: society.id, name: 'Wing A', code: 'A' },
  });
  const wingB = await prisma.building.create({
    data: { societyId: society.id, name: 'Wing B', code: 'B' },
  });

  const unitA101 = await prisma.unit.create({
    data: { societyId: society.id, buildingId: wingA.id, number: '101', floor: '1' },
  });
  const unitA102 = await prisma.unit.create({
    data: { societyId: society.id, buildingId: wingA.id, number: '102', floor: '1' },
  });
  const unitB201 = await prisma.unit.create({
    data: { societyId: society.id, buildingId: wingB.id, number: '201', floor: '2' },
  });

  await prisma.unitRelationship.createMany({
    data: [
      {
        societyId: society.id,
        unitId: unitA101.id,
        userId: owner1.id,
        type: 'OWNER',
      },
      {
        societyId: society.id,
        unitId: unitA102.id,
        userId: owner2.id,
        type: 'OWNER',
      },
      {
        societyId: society.id,
        unitId: unitB201.id,
        userId: owner2.id,
        type: 'OWNER',
      },
    ],
  });

  // ₹3500 + ₹500 parking = ₹4000 / unit (stored as paise)
  const maintenanceAmount = rupeesToPaise(3500);
  const parkingAmount = rupeesToPaise(500);

  const maintenanceRule = await prisma.maintenanceRule.create({
    data: {
      societyId: society.id,
      name: 'Monthly Maintenance',
      code: 'MAINT',
      calcMode: 'FIXED_PER_UNIT',
      amount: maintenanceAmount,
      frequency: 'MONTHLY',
      active: true,
      versions: {
        create: {
          societyId: society.id,
          amount: maintenanceAmount,
          calcMode: 'FIXED_PER_UNIT',
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        },
      },
    },
  });

  const parkingRule = await prisma.maintenanceRule.create({
    data: {
      societyId: society.id,
      name: 'Parking',
      code: 'PARK',
      calcMode: 'FIXED_PER_UNIT',
      amount: parkingAmount,
      frequency: 'MONTHLY',
      active: true,
      versions: {
        create: {
          societyId: society.id,
          amount: parkingAmount,
          calcMode: 'FIXED_PER_UNIT',
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        },
      },
    },
  });

  const periodStart = new Date('2026-07-01T00:00:00.000Z');
  const periodEnd = new Date('2026-07-31T00:00:00.000Z');
  const issueDate = new Date('2026-07-01T00:00:00.000Z');
  const dueDate = new Date('2026-07-10T00:00:00.000Z');
  const lineTotal = maintenanceAmount + parkingAmount;

  const billingRun = await prisma.billingRun.create({
    data: {
      societyId: society.id,
      label: '2026-07',
      periodStart,
      periodEnd,
      status: 'COMPLETED',
      createdByUserId: admin.id,
      invoiceCount: 3,
    },
  });

  const units = [
    { unit: unitA101, seq: 1 },
    { unit: unitA102, seq: 2 },
    { unit: unitB201, seq: 3 },
  ];

  for (const { unit, seq } of units) {
    const invoiceNumber = `INV-2026-07-${String(seq).padStart(3, '0')}`;
    // A-101: partial ₹2500 of ₹4000; others unpaid
    const paid = seq === 1 ? rupeesToPaise(2500) : 0;
    const outstanding = lineTotal - paid;
    const status =
      paid > 0 && paid < lineTotal
        ? 'PARTIALLY_PAID'
        : paid === lineTotal
          ? 'PAID'
          : 'ISSUED';

    const invoice = await prisma.invoice.create({
      data: {
        societyId: society.id,
        unitId: unit.id,
        billingRunId: billingRun.id,
        invoiceNumber,
        status,
        periodStart,
        periodEnd,
        issueDate,
        dueDate,
        currency: 'INR',
        subtotal: lineTotal,
        total: lineTotal,
        paidAmount: paid,
        outstandingAmount: outstanding,
        lines: {
          create: [
            {
              societyId: society.id,
              description: maintenanceRule.name,
              ruleId: maintenanceRule.id,
              amount: maintenanceAmount,
              sortOrder: 1,
            },
            {
              societyId: society.id,
              description: parkingRule.name,
              ruleId: parkingRule.id,
              amount: parkingAmount,
              sortOrder: 2,
            },
          ],
        },
      },
    });

    if (paid > 0) {
      const payment = await prisma.payment.create({
        data: {
          societyId: society.id,
          unitId: unit.id,
          amount: paid,
          mode: 'UPI',
          status: 'RECORDED',
          receiptNumber: 'RCP-20260705-0001',
          reference: 'UPI-DEMO-001',
          paidAt: new Date('2026-07-05T10:00:00.000Z'),
          recordedByUserId: treasurer.id,
          notes: 'Demo partial payment',
        },
      });
      await prisma.paymentAllocation.create({
        data: {
          societyId: society.id,
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: paid,
        },
      });
    }
  }

  await prisma.notice.create({
    data: {
      societyId: society.id,
      title: 'Welcome to Green Valley',
      body: 'Demo notice: AGM scheduled for next month. Please update your contact details.',
      status: 'PUBLISHED',
      audience: 'SOCIETY',
      createdByUserId: admin.id,
      publishedAt: new Date('2026-07-01T00:00:00.000Z'),
    },
  });

  await prisma.complaint.create({
    data: {
      societyId: society.id,
      unitId: unitA101.id,
      category: 'Maintenance',
      subject: 'Lift noise on floor 1',
      description: 'Demo complaint for MVP-3 testing.',
      priority: 'MEDIUM',
      status: 'OPEN',
      createdByUserId: owner1.id,
    },
  });

  await prisma.meeting.create({
    data: {
      societyId: society.id,
      title: 'Annual General Meeting',
      agenda: 'Budget review, maintenance plan, committee elections prep',
      description: 'Demo AGM for MVP-3 meetings.',
      scheduledAt: new Date('2026-08-15T10:30:00.000Z'),
      location: 'Clubhouse hall',
      audience: 'SOCIETY',
      status: 'SCHEDULED',
      createdByUserId: admin.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        societyId: society.id,
        userId: owner1.id,
        channel: 'IN_APP',
        type: 'notice.published',
        title: 'Notice: Welcome to Green Valley',
        body: 'Demo notice: AGM scheduled for next month.',
        entityType: 'Notice',
      },
      {
        societyId: society.id,
        userId: admin.id,
        channel: 'IN_APP',
        type: 'complaint.status',
        title: 'Complaint update: Lift noise on floor 1',
        body: 'New complaint opened by a resident.',
        entityType: 'Complaint',
      },
    ],
  });

  const mainGate = await prisma.gate.create({
    data: {
      societyId: society.id,
      name: 'Main Gate',
      code: 'MG-1',
      active: true,
    },
  });

  await prisma.emergencyContact.createMany({
    data: [
      {
        societyId: society.id,
        label: 'Security desk',
        phone: '1800-000-1111',
        category: 'SECURITY',
        sortOrder: 1,
      },
      {
        societyId: society.id,
        label: 'Fire station',
        phone: '101',
        category: 'FIRE',
        sortOrder: 2,
      },
    ],
  });

  await prisma.vehicle.create({
    data: {
      societyId: society.id,
      unitId: unitA101.id,
      registrationNumber: 'GJ01AB1234',
      type: 'CAR',
      makeModel: 'Honda City',
      ownerName: 'Riya Sharma',
      active: true,
    },
  });

  await prisma.visitor.create({
    data: {
      societyId: society.id,
      category: 'DELIVERY',
      name: 'Courier Partner',
      mobile: '9876500001',
      purpose: 'Package delivery',
      unitId: unitA101.id,
      gateId: mainGate.id,
      status: 'APPROVED',
      requestedByUserId: owner1.id,
      approvedByUserId: owner1.id,
    },
  });

  const clubhouse = await prisma.amenity.create({
    data: {
      societyId: society.id,
      name: 'Clubhouse',
      description: 'Community hall for events',
      capacity: 1,
      feePaise: rupeesToPaise(500),
      depositPaise: rupeesToPaise(1000),
      slotMinutes: 120,
      advanceBookingDays: 30,
      active: true,
    },
  });

  await prisma.amenityBooking.create({
    data: {
      societyId: society.id,
      amenityId: clubhouse.id,
      unitId: unitA101.id,
      bookedByUserId: owner1.id,
      startAt: new Date('2026-08-20T10:00:00.000Z'),
      endAt: new Date('2026-08-20T12:00:00.000Z'),
      status: 'CONFIRMED',
      feePaise: clubhouse.feePaise,
      depositPaise: clubhouse.depositPaise,
    },
  });

  await prisma.householdMember.create({
    data: {
      societyId: society.id,
      unitId: unitA101.id,
      name: 'Kabir Sharma',
      relation: 'SON',
      mobile: '9876500101',
      active: true,
    },
  });

  await prisma.servicePersonnel.create({
    data: {
      societyId: society.id,
      name: 'Sunita Devi',
      mobile: '9876500202',
      serviceType: 'MAID',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      units: {
        create: [{ societyId: society.id, unitId: unitA101.id }],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      societyId: society.id,
      action: 'seed.demo',
      entityType: 'Society',
      entityId: society.id,
      after: { message: 'Demo dataset loaded' },
    },
  });

  console.log('');
  console.log('Demo seed complete.');
  console.log('Password for all users: Password123!');
  console.log('  admin@urbangate.demo      (platform + society admin)');
  console.log('  treasurer@urbangate.demo  (treasurer)');
  console.log('  owner1@urbangate.demo     (Wing A / 101)');
  console.log('  owner2@urbangate.demo     (Wing A / 102, Wing B / 201)');
  console.log('  guard@urbangate.demo      (security guard)');
  console.log(`Society: ${society.name} (${society.slug})`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
