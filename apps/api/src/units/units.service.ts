import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UnitRelationshipType } from '@urbangate/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async list(user: AuthUser): Promise<unknown> {
    const societyId = this.societies.requireActiveSociety(user);
    const unitIds = this.societies.shouldScopeToLinkedUnits(user)
      ? await this.societies.unitIdsForUser(user)
      : null;
    return this.prisma.unit.findMany({
      where: {
        societyId,
        ...(unitIds ? { id: { in: unitIds } } : {}),
      },
      include: { building: true, relationships: true },
      orderBy: [{ buildingId: 'asc' }, { number: 'asc' }],
    });
  }

  async create(
    user: AuthUser,
    input: { buildingId: string; number: string; floor?: string },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const building = await this.prisma.building.findFirst({
      where: { id: input.buildingId, societyId },
    });
    if (!building) {
      throw new BadRequestException({
        error: 'INVALID_BUILDING',
        message: 'Building not found in active society',
      });
    }

    const unit = await this.prisma.unit.create({
      data: {
        societyId,
        buildingId: building.id,
        number: input.number.trim(),
        floor: input.floor?.trim() || undefined,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'unit.create',
      entityType: 'Unit',
      entityId: unit.id,
      after: { number: unit.number, buildingId: unit.buildingId },
    });

    return unit;
  }

  async update(
    user: AuthUser,
    id: string,
    input: { number?: string; floor?: string },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.unit.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Unit not found' });
    }
    const unit = await this.prisma.unit.update({
      where: { id },
      data: {
        number: input.number?.trim() || undefined,
        floor: input.floor?.trim(),
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'unit.update',
      entityType: 'Unit',
      entityId: id,
      before: { number: existing.number },
      after: { number: unit.number },
    });
    return unit;
  }

  async remove(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.unit.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Unit not found' });
    }
    const invoiceCount = await this.prisma.invoice.count({ where: { unitId: id, societyId } });
    if (invoiceCount > 0) {
      throw new BadRequestException({
        error: 'UNIT_HAS_INVOICES',
        message: 'Cannot delete a unit that has invoices',
      });
    }
    await this.prisma.unitRelationship.deleteMany({ where: { unitId: id } });
    await this.prisma.householdMember.deleteMany({ where: { unitId: id, societyId } });
    await this.prisma.servicePersonnelUnit.deleteMany({ where: { unitId: id } });
    await this.prisma.vehicle.updateMany({ where: { unitId: id }, data: { unitId: null } });
    await this.prisma.visitor.updateMany({ where: { unitId: id }, data: { unitId: null } });
    await this.prisma.amenityBooking.updateMany({ where: { unitId: id }, data: { unitId: null } });
    await this.prisma.unit.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'unit.delete',
      entityType: 'Unit',
      entityId: id,
      before: { number: existing.number },
    });
    return { ok: true };
  }

  async assignRelationship(
    user: AuthUser,
    input: { unitId: string; userId: string; type: UnitRelationshipType },
  ): Promise<unknown> {
    const societyId = this.societies.requireActiveSociety(user);
    const unit = await this.prisma.unit.findFirst({
      where: { id: input.unitId, societyId },
    });
    if (!unit) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Unit not found' });
    }

    const membership = await this.prisma.societyMembership.findUnique({
      where: {
        societyId_userId: { societyId, userId: input.userId },
      },
    });
    if (!membership) {
      throw new BadRequestException({
        error: 'NOT_A_MEMBER',
        message: 'User must be a society member first',
      });
    }

    const relationship = await this.prisma.unitRelationship.upsert({
      where: {
        unitId_userId_type: {
          unitId: input.unitId,
          userId: input.userId,
          type: input.type,
        },
      },
      create: {
        societyId,
        unitId: input.unitId,
        userId: input.userId,
        type: input.type,
      },
      update: {},
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'unit.relationship.assign',
      entityType: 'UnitRelationship',
      entityId: relationship.id,
      after: { unitId: input.unitId, userId: input.userId, type: input.type },
    });

    return relationship;
  }
}
