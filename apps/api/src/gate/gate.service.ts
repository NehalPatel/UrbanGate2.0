import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { VisitorStatus } from '@urbangate/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';
import { canTransitionVisitor } from './visitor.rules';
import { assertMongoObjectId } from '../common/mongo-id';

@Injectable()
export class GateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async listGates(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.gate.findMany({
      where: { societyId },
      orderBy: { name: 'asc' },
    });
  }

  async createGate(user: AuthUser, input: { name: string; code?: string }) {
    const societyId = this.societies.requireActiveSociety(user);
    const gate = await this.prisma.gate.create({
      data: {
        societyId,
        name: input.name.trim(),
        code: input.code?.trim() || undefined,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'gate.create',
      entityType: 'Gate',
      entityId: gate.id,
      after: { name: gate.name },
    });
    return gate;
  }

  async updateGate(
    user: AuthUser,
    id: string,
    input: { name?: string; code?: string; active?: boolean },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.gate.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Gate not found' });
    }
    const gate = await this.prisma.gate.update({
      where: { id },
      data: {
        name: input.name?.trim() || undefined,
        code: input.code?.trim(),
        active: input.active,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'gate.update',
      entityType: 'Gate',
      entityId: id,
      before: { name: existing.name, active: existing.active },
      after: { name: gate.name, active: gate.active },
    });
    return gate;
  }

  async removeGate(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.gate.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Gate not found' });
    }
    await this.prisma.visitor.updateMany({ where: { gateId: id }, data: { gateId: null } });
    await this.prisma.gate.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'gate.delete',
      entityType: 'Gate',
      entityId: id,
      before: { name: existing.name },
    });
    return { ok: true };
  }

  async listVisitors(user: AuthUser, status?: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const staff =
      user.permissions.includes('visitor.checkin') ||
      user.permissions.includes('gate.manage');
    const unitIds = staff ? null : await this.societies.unitIdsForUser(user);
    return this.prisma.visitor.findMany({
      where: {
        societyId,
        ...(status ? { status: status as VisitorStatus } : {}),
        ...(unitIds
          ? {
              OR: [
                { requestedByUserId: user.id },
                ...(unitIds.length ? [{ unitId: { in: unitIds } }] : []),
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createVisitor(
    user: AuthUser,
    input: {
      name: string;
      mobile: string;
      category?: string;
      purpose?: string;
      vehicleNumber?: string;
      unitId?: string;
      gateId?: string;
      notes?: string;
      preApproved?: boolean;
      checkInNow?: boolean;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    if (input.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: input.unitId, societyId },
      });
      if (!unit) {
        throw new BadRequestException({ error: 'INVALID_UNIT', message: 'Unit not found' });
      }
    }
    if (input.gateId) {
      const gate = await this.prisma.gate.findFirst({
        where: { id: input.gateId, societyId },
      });
      if (!gate) {
        throw new BadRequestException({ error: 'INVALID_GATE', message: 'Gate not found' });
      }
    }

    let status: VisitorStatus = 'REQUESTED';
    const now = new Date();
    let entryAt: Date | undefined;
    let checkedInByUserId: string | undefined;
    let approvedByUserId: string | undefined;

    if (input.checkInNow) {
      status = 'CHECKED_IN';
      entryAt = now;
      checkedInByUserId = user.id;
      approvedByUserId = user.id;
    } else if (input.preApproved) {
      status = 'APPROVED';
      approvedByUserId = user.id;
    }

    const visitor = await this.prisma.visitor.create({
      data: {
        societyId,
        name: input.name.trim(),
        mobile: input.mobile.trim(),
        category: (input.category?.trim() || 'GUEST').toUpperCase(),
        purpose: input.purpose?.trim() || undefined,
        vehicleNumber: input.vehicleNumber?.trim().toUpperCase() || undefined,
        unitId: input.unitId,
        gateId: input.gateId,
        notes: input.notes?.trim() || undefined,
        status,
        requestedByUserId: user.id,
        approvedByUserId,
        checkedInByUserId,
        entryAt,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'visitor.create',
      entityType: 'Visitor',
      entityId: visitor.id,
      after: { name: visitor.name, status: visitor.status },
    });

    return visitor;
  }

  async approveVisitor(user: AuthUser, id: string) {
    return this.transition(user, id, ['REQUESTED'], 'APPROVED', {
      approvedByUserId: user.id,
    });
  }

  async rejectVisitor(user: AuthUser, id: string) {
    return this.transition(user, id, ['REQUESTED'], 'REJECTED', {});
  }

  async checkIn(user: AuthUser, id: string) {
    return this.transition(user, id, ['APPROVED', 'REQUESTED'], 'CHECKED_IN', {
      checkedInByUserId: user.id,
      entryAt: new Date(),
      approvedByUserId: user.id,
    });
  }

  async checkOut(user: AuthUser, id: string) {
    return this.transition(user, id, ['CHECKED_IN'], 'CHECKED_OUT', {
      checkedOutByUserId: user.id,
      exitAt: new Date(),
    });
  }

  async listEmergency(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.emergencyContact.findMany({
      where: { societyId, active: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  async createEmergency(
    user: AuthUser,
    input: { label: string; phone: string; category?: string },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.emergencyContact.create({
      data: {
        societyId,
        label: input.label.trim(),
        phone: input.phone.trim(),
        category: (input.category?.trim() || 'OTHER').toUpperCase(),
      },
    });
  }

  async updateEmergency(
    user: AuthUser,
    id: string,
    input: { label?: string; phone?: string; category?: string; active?: boolean },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.emergencyContact.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Contact not found' });
    }
    return this.prisma.emergencyContact.update({
      where: { id },
      data: {
        label: input.label?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        category: input.category?.trim()?.toUpperCase() || undefined,
        active: input.active,
      },
    });
  }

  async removeEmergency(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.emergencyContact.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Contact not found' });
    }
    await this.prisma.emergencyContact.update({
      where: { id },
      data: { active: false },
    });
    return { ok: true };
  }

  async listVehicles(user: AuthUser, q?: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const query = q?.trim().toUpperCase();
    const staff =
      this.societies.isSocietyStaff(user) ||
      user.permissions.includes('visitor.checkin') ||
      user.permissions.includes('gate.manage');
    const unitIds = staff ? null : await this.societies.unitIdsForUser(user);
    const rows = await this.prisma.vehicle.findMany({
      where: {
        societyId,
        active: true,
        ...(unitIds ? { unitId: { in: unitIds } } : {}),
      },
      orderBy: { registrationNumber: 'asc' },
      take: 100,
    });
    if (!query) return rows.slice(0, 50);
    return rows
      .filter((v) => v.registrationNumber.toUpperCase().includes(query))
      .slice(0, 50);
  }

  async createVehicle(
    user: AuthUser,
    input: {
      registrationNumber: string;
      type?: string;
      makeModel?: string;
      ownerName?: string;
      unitId?: string;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    if (input.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: input.unitId, societyId },
      });
      if (!unit) {
        throw new BadRequestException({ error: 'INVALID_UNIT', message: 'Unit not found' });
      }
    }
    return this.prisma.vehicle.create({
      data: {
        societyId,
        registrationNumber: input.registrationNumber.trim().toUpperCase(),
        type: (input.type?.trim() || 'CAR').toUpperCase(),
        makeModel: input.makeModel?.trim() || undefined,
        ownerName: input.ownerName?.trim() || undefined,
        unitId: input.unitId,
      },
    });
  }

  async updateVehicle(
    user: AuthUser,
    id: string,
    input: {
      registrationNumber?: string;
      type?: string;
      makeModel?: string;
      ownerName?: string;
      unitId?: string;
      active?: boolean;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.vehicle.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Vehicle not found' });
    }
    if (input.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: input.unitId, societyId },
      });
      if (!unit) {
        throw new BadRequestException({ error: 'INVALID_UNIT', message: 'Unit not found' });
      }
    }
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        registrationNumber: input.registrationNumber?.trim().toUpperCase() || undefined,
        type: input.type?.trim()?.toUpperCase() || undefined,
        makeModel: input.makeModel?.trim(),
        ownerName: input.ownerName?.trim(),
        unitId: input.unitId,
        active: input.active,
      },
    });
  }

  async removeVehicle(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.vehicle.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Vehicle not found' });
    }
    await this.prisma.vehicle.update({ where: { id }, data: { active: false } });
    return { ok: true };
  }

  async lookupMembers(user: AuthUser, q?: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const query = q?.trim().toLowerCase();
    const memberships = await this.prisma.societyMembership.findMany({
      where: { societyId, status: 'active' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      take: 100,
    });
    const mapped = memberships.map((m) => ({
      membershipId: m.id,
      userId: m.userId,
      roleKeys: m.roleKeys,
      name: m.user.name,
      email: m.user.email,
    }));
    if (!query) return mapped.slice(0, 30);
    return mapped
      .filter(
        (m) =>
          m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query),
      )
      .slice(0, 30);
  }

  async lookupUnits(user: AuthUser, q?: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const query = q?.trim().toLowerCase();
    const units = await this.prisma.unit.findMany({
      where: { societyId },
      include: { building: { select: { id: true, name: true } } },
      orderBy: { number: 'asc' },
      take: 200,
    });
    if (!query) return units.slice(0, 40);
    return units
      .filter(
        (u) =>
          u.number.toLowerCase().includes(query) ||
          u.building.name.toLowerCase().includes(query),
      )
      .slice(0, 40);
  }

  private async transition(
    user: AuthUser,
    id: string,
    from: VisitorStatus[],
    to: VisitorStatus,
    extra: Record<string, unknown>,
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    assertMongoObjectId(id, 'visitor id');
    const existing = await this.prisma.visitor.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Visitor not found' });
    }
    if (!from.includes(existing.status) || !canTransitionVisitor(existing.status, to)) {
      throw new BadRequestException({
        error: 'INVALID_STATUS',
        message: `Cannot move from ${existing.status} to ${to}`,
      });
    }
    const visitor = await this.prisma.visitor.update({
      where: { id },
      data: { status: to, ...extra },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: `visitor.${to.toLowerCase()}`,
      entityType: 'Visitor',
      entityId: id,
      before: { status: existing.status },
      after: { status: visitor.status },
    });
    return visitor;
  }
}
