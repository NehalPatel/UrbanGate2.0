import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';
import type { BillingFrequency, ChargeCalcMode } from '@urbangate/database';
import { paiseToRupees, rupeesToPaise } from './money';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const rules = await this.prisma.maintenanceRule.findMany({
      where: { societyId },
      include: { versions: { orderBy: { effectiveFrom: 'desc' }, take: 5 } },
      orderBy: { name: 'asc' },
    });
    return rules.map((r) => ({
      ...r,
      amount: paiseToRupees(r.amount),
      versions: r.versions.map((v) => ({ ...v, amount: paiseToRupees(v.amount) })),
    }));
  }

  async create(
    user: AuthUser,
    input: {
      name: string;
      code?: string;
      amount: string;
      frequency?: BillingFrequency;
      calcMode?: ChargeCalcMode;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const amount = rupeesToPaise(input.amount);
    if (amount <= 0) {
      throw new BadRequestException({
        error: 'INVALID_AMOUNT',
        message: 'Amount must be positive',
      });
    }

    const rule = await this.prisma.maintenanceRule.create({
      data: {
        societyId,
        name: input.name.trim(),
        code: input.code?.trim() || undefined,
        amount,
        frequency: input.frequency ?? 'MONTHLY',
        calcMode: input.calcMode ?? 'FIXED_PER_UNIT',
        versions: {
          create: {
            societyId,
            amount,
            calcMode: input.calcMode ?? 'FIXED_PER_UNIT',
            effectiveFrom: new Date(),
          },
        },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'maintenance.create',
      entityType: 'MaintenanceRule',
      entityId: rule.id,
      after: { name: rule.name, amount: paiseToRupees(amount) },
    });

    return { ...rule, amount: paiseToRupees(rule.amount) };
  }

  async update(
    user: AuthUser,
    id: string,
    input: { name?: string; amount?: string; active?: boolean },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.maintenanceRule.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Rule not found' });
    }

    const amount = input.amount !== undefined ? rupeesToPaise(input.amount) : undefined;
    const rule = await this.prisma.maintenanceRule.update({
      where: { id },
      data: {
        name: input.name?.trim() || undefined,
        amount,
        active: input.active,
        ...(amount !== undefined
          ? {
              versions: {
                create: {
                  societyId,
                  amount,
                  calcMode: existing.calcMode,
                  effectiveFrom: new Date(),
                },
              },
            }
          : {}),
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'maintenance.update',
      entityType: 'MaintenanceRule',
      entityId: id,
      before: { amount: paiseToRupees(existing.amount) },
      after: { amount: paiseToRupees(rule.amount), active: rule.active },
    });

    return { ...rule, amount: paiseToRupees(rule.amount) };
  }

  async remove(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.maintenanceRule.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Rule not found' });
    }
    await this.prisma.maintenanceRuleVersion.deleteMany({ where: { ruleId: id } });
    await this.prisma.maintenanceRule.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'maintenance.delete',
      entityType: 'MaintenanceRule',
      entityId: id,
      before: { name: existing.name },
    });
    return { ok: true };
  }
}
