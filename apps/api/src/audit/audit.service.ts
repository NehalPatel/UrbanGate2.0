import { Injectable } from '@nestjs/common';
import { Prisma } from '@urbangate/database';
import { PrismaService } from '../prisma/prisma.service';

export type AuditInput = {
  actorUserId?: string | null;
  societyId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? undefined,
        societyId: input.societyId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        before: input.before ?? undefined,
        after: input.after ?? undefined,
        correlationId: input.correlationId ?? undefined,
        ip: input.ip ?? undefined,
        userAgent: input.userAgent ?? undefined,
      },
    });
  }
}
