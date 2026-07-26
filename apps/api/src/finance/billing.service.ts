import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';
import { paiseToRupees } from './money';

function endOfMonthUtc(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0));
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async listRuns(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.billingRun.findMany({
      where: { societyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async runBilling(user: AuthUser, input: { label: string; dueDay?: number }) {
    const societyId = this.societies.requireActiveSociety(user);
    const match = /^(\d{4})-(\d{2})$/.exec(input.label.trim());
    if (!match) {
      throw new BadRequestException({
        error: 'INVALID_LABEL',
        message: 'Billing label must be YYYY-MM',
      });
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) {
      throw new BadRequestException({
        error: 'INVALID_LABEL',
        message: 'Month must be 01-12',
      });
    }

    const existing = await this.prisma.billingRun.findUnique({
      where: { societyId_label: { societyId, label: input.label.trim() } },
    });
    if (existing) {
      throw new ConflictException({
        error: 'BILLING_EXISTS',
        message: `Billing run ${input.label} already exists`,
        details: { billingRunId: existing.id },
      });
    }

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = endOfMonthUtc(year, month - 1);
    const dueDay = Math.min(Math.max(input.dueDay ?? 10, 1), periodEnd.getUTCDate());
    const dueDate = new Date(Date.UTC(year, month - 1, dueDay));
    const issueDate = periodStart;

    const rules = await this.prisma.maintenanceRule.findMany({
      where: { societyId, active: true },
      orderBy: { name: 'asc' },
    });
    if (rules.length === 0) {
      throw new BadRequestException({
        error: 'NO_RULES',
        message: 'Create at least one active maintenance rule first',
      });
    }

    const units = await this.prisma.unit.findMany({
      where: { societyId },
      orderBy: [{ buildingId: 'asc' }, { number: 'asc' }],
    });
    if (units.length === 0) {
      throw new BadRequestException({
        error: 'NO_UNITS',
        message: 'Add units before running billing',
      });
    }

    const chargePerUnit = rules.reduce((sum, rule) => sum + rule.amount, 0);

    const run = await this.prisma.billingRun.create({
      data: {
        societyId,
        label: input.label.trim(),
        periodStart,
        periodEnd,
        status: 'COMPLETED',
        createdByUserId: user.id,
        invoiceCount: units.length,
      },
    });

    let seq = 1;
    for (const unit of units) {
      const invoiceNumber = `INV-${input.label.trim()}-${String(seq).padStart(3, '0')}`;
      await this.prisma.invoice.create({
        data: {
          societyId,
          unitId: unit.id,
          billingRunId: run.id,
          invoiceNumber,
          status: 'ISSUED',
          periodStart,
          periodEnd,
          issueDate,
          dueDate,
          currency: 'INR',
          subtotal: chargePerUnit,
          total: chargePerUnit,
          paidAmount: 0,
          outstandingAmount: chargePerUnit,
          lines: {
            create: rules.map((rule, index) => ({
              societyId,
              description: rule.name,
              ruleId: rule.id,
              amount: rule.amount,
              sortOrder: index + 1,
            })),
          },
        },
      });
      seq += 1;
    }

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'billing.run',
      entityType: 'BillingRun',
      entityId: run.id,
      after: { label: run.label, invoiceCount: units.length },
    });

    const full = await this.prisma.billingRun.findUniqueOrThrow({
      where: { id: run.id },
      include: { invoices: { include: { unit: true, lines: true } } },
    });

    return {
      ...full,
      invoices: full.invoices.map((inv) => ({
        ...inv,
        subtotal: paiseToRupees(inv.subtotal),
        total: paiseToRupees(inv.total),
        paidAmount: paiseToRupees(inv.paidAmount),
        outstandingAmount: paiseToRupees(inv.outstandingAmount),
        lines: inv.lines.map((l) => ({ ...l, amount: paiseToRupees(l.amount) })),
      })),
    };
  }
}
