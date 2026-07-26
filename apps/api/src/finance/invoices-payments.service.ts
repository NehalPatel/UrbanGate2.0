import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';
import type { PaymentMode } from '@urbangate/database';
import { paiseToRupees, rupeesToPaise } from './money';

function mapInvoice<T extends {
  subtotal: number;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  lines?: Array<{ amount: number } & Record<string, unknown>>;
}>(invoice: T) {
  return {
    ...invoice,
    subtotal: paiseToRupees(invoice.subtotal),
    total: paiseToRupees(invoice.total),
    paidAmount: paiseToRupees(invoice.paidAmount),
    outstandingAmount: paiseToRupees(invoice.outstandingAmount),
    lines: invoice.lines?.map((l) => ({ ...l, amount: paiseToRupees(l.amount) })),
  };
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly societies: SocietiesService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const invoices = await this.prisma.invoice.findMany({
      where: { societyId },
      include: {
        unit: { include: { building: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { invoiceNumber: 'desc' },
    });
    return invoices.map((inv) => mapInvoice(inv));
  }

  async get(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, societyId },
      include: {
        unit: { include: { building: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
        allocations: { include: { payment: true } },
      },
    });
    if (!invoice) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Invoice not found' });
    }
    return {
      ...mapInvoice(invoice),
      allocations: invoice.allocations.map((a) => ({
        ...a,
        amount: paiseToRupees(a.amount),
        payment: {
          ...a.payment,
          amount: paiseToRupees(a.payment.amount),
        },
      })),
    };
  }

  async collectionReport(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const invoices = await this.prisma.invoice.findMany({
      where: {
        societyId,
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
    });

    const totals = invoices.reduce(
      (acc, inv) => {
        acc.billed += inv.total;
        acc.collected += inv.paidAmount;
        acc.outstanding += inv.outstandingAmount;
        return acc;
      },
      { billed: 0, collected: 0, outstanding: 0 },
    );

    return {
      invoiceCount: invoices.length,
      billed: paiseToRupees(totals.billed),
      collected: paiseToRupees(totals.collected),
      outstanding: paiseToRupees(totals.outstanding),
      byStatus: invoices.reduce<Record<string, number>>((map, inv) => {
        map[inv.status] = (map[inv.status] ?? 0) + 1;
        return map;
      }, {}),
    };
  }
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const payments = await this.prisma.payment.findMany({
      where: { societyId },
      include: { allocations: true, unit: true },
      orderBy: { paidAt: 'desc' },
    });
    return payments.map((p) => ({
      ...p,
      amount: paiseToRupees(p.amount),
      allocations: p.allocations.map((a) => ({
        ...a,
        amount: paiseToRupees(a.amount),
      })),
    }));
  }

  async record(
    user: AuthUser,
    input: {
      invoiceId: string;
      amount: string;
      mode: PaymentMode;
      reference?: string;
      paidAt?: string;
      notes?: string;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const amount = rupeesToPaise(input.amount);
    if (amount <= 0) {
      throw new BadRequestException({
        error: 'INVALID_AMOUNT',
        message: 'Payment amount must be positive',
      });
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: input.invoiceId, societyId },
    });
    if (!invoice) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Invoice not found' });
    }
    if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
      throw new BadRequestException({
        error: 'INVOICE_CLOSED',
        message: `Cannot pay invoice in status ${invoice.status}`,
      });
    }
    if (amount > invoice.outstandingAmount) {
      throw new BadRequestException({
        error: 'OVERPAY',
        message: 'Amount exceeds outstanding balance',
      });
    }

    const paidAmount = invoice.paidAmount + amount;
    const outstandingAmount = invoice.total - paidAmount;
    const status =
      outstandingAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : invoice.status;

    const payment = await this.prisma.$transaction(async (tx) => {
      const count = await tx.payment.count({ where: { societyId } });
      const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

      const created = await tx.payment.create({
        data: {
          societyId,
          unitId: invoice.unitId,
          amount,
          mode: input.mode,
          status: 'RECORDED',
          receiptNumber,
          reference: input.reference?.trim() || undefined,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
          recordedByUserId: user.id,
          notes: input.notes?.trim() || undefined,
        },
      });

      await tx.paymentAllocation.create({
        data: {
          societyId,
          paymentId: created.id,
          invoiceId: invoice.id,
          amount,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount,
          outstandingAmount,
          status,
        },
      });

      return created;
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'payment.record',
      entityType: 'Payment',
      entityId: payment.id,
      after: {
        invoiceId: invoice.id,
        amount: paiseToRupees(amount),
        mode: input.mode,
        receiptNumber: payment.receiptNumber,
      },
    });

    return {
      ...payment,
      amount: paiseToRupees(payment.amount),
    };
  }

  async getReceipt(user: AuthUser, paymentId: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, societyId },
      include: {
        unit: { include: { building: true } },
        allocations: { include: { invoice: true } },
      },
    });
    if (!payment) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Payment not found' });
    }

    let receiptNumber = payment.receiptNumber;
    if (!receiptNumber) {
      const count = await this.prisma.payment.count({ where: { societyId } });
      receiptNumber = `RCP-${payment.paidAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(count).padStart(4, '0')}`;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { receiptNumber },
      });
    }

    const society = await this.prisma.society.findUniqueOrThrow({ where: { id: societyId } });
    const recorder = await this.prisma.user.findUnique({
      where: { id: payment.recordedByUserId },
      select: { id: true, name: true, email: true },
    });

    return {
      receiptNumber,
      society: { name: society.name, currency: society.currency },
      payment: {
        id: payment.id,
        amount: paiseToRupees(payment.amount),
        mode: payment.mode,
        status: payment.status,
        reference: payment.reference,
        paidAt: payment.paidAt,
        notes: payment.notes,
      },
      unit: payment.unit
        ? {
            number: payment.unit.number,
            building: payment.unit.building.name,
          }
        : null,
      recordedBy: recorder,
      invoices: payment.allocations.map((a) => ({
        invoiceId: a.invoiceId,
        invoiceNumber: a.invoice.invoiceNumber,
        amount: paiseToRupees(a.amount),
      })),
    };
  }

  async reverse(user: AuthUser, paymentId: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, societyId },
      include: { allocations: true },
    });
    if (!payment) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Payment not found' });
    }
    if (payment.status === 'REVERSED') {
      throw new BadRequestException({
        error: 'ALREADY_REVERSED',
        message: 'Payment already reversed',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const allocation of payment.allocations) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: allocation.invoiceId },
        });
        const paidAmount = invoice.paidAmount - allocation.amount;
        const outstandingAmount = invoice.total - paidAmount;
        const status =
          paidAmount === 0 ? 'ISSUED' : paidAmount < invoice.total ? 'PARTIALLY_PAID' : 'PAID';

        await tx.invoice.update({
          where: { id: invoice.id },
          data: { paidAmount, outstandingAmount, status },
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REVERSED', reversedAt: new Date() },
      });
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'payment.reverse',
      entityType: 'Payment',
      entityId: payment.id,
    });

    const updated = await this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    return { ...updated, amount: paiseToRupees(updated.amount) };
  }
}
