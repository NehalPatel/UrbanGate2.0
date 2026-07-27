import { PrismaClient } from '@prisma/client';

export { PrismaClient, Prisma } from '@prisma/client';
export type {
  UnitRelationshipType,
  UserStatus,
  BillingFrequency,
  ChargeCalcMode,
  PaymentMode,
  InvoiceStatus,
  PaymentStatus,
  NoticeStatus,
  ComplaintStatus,
  ComplaintPriority,
  MeetingStatus,
  VisitorStatus,
  BookingStatus,
} from '@prisma/client';

declare global {
  var __urbangatePrisma: PrismaClient | undefined;
}

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient({
    datasources: databaseUrl
      ? {
          db: { url: databaseUrl },
        }
      : undefined,
  });
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__urbangatePrisma) {
    globalThis.__urbangatePrisma = createPrismaClient();
  }
  return globalThis.__urbangatePrisma;
}
