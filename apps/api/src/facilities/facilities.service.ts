import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BookingStatus } from '@urbangate/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';
import { rupeesToPaise, paiseToRupees } from '../finance/money';

@Injectable()
export class FacilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async listAmenities(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const rows = await this.prisma.amenity.findMany({
      where: { societyId },
      orderBy: { name: 'asc' },
    });
    return rows.map((a) => this.mapAmenity(a));
  }

  async createAmenity(
    user: AuthUser,
    input: {
      name: string;
      description?: string;
      capacity?: number;
      feeRupees?: string;
      depositRupees?: string;
      slotMinutes?: number;
      advanceBookingDays?: number;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const amenity = await this.prisma.amenity.create({
      data: {
        societyId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        capacity: input.capacity ?? 1,
        feePaise: input.feeRupees ? rupeesToPaise(input.feeRupees) : 0,
        depositPaise: input.depositRupees
          ? rupeesToPaise(input.depositRupees)
          : 0,
        slotMinutes: input.slotMinutes ?? 60,
        advanceBookingDays: input.advanceBookingDays ?? 14,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'amenity.create',
      entityType: 'Amenity',
      entityId: amenity.id,
      after: { name: amenity.name },
    });
    return this.mapAmenity(amenity);
  }

  async updateAmenity(
    user: AuthUser,
    id: string,
    input: {
      name?: string;
      description?: string;
      capacity?: number;
      feeRupees?: string;
      depositRupees?: string;
      slotMinutes?: number;
      advanceBookingDays?: number;
      active?: boolean;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.amenity.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Amenity not found' });
    }
    const amenity = await this.prisma.amenity.update({
      where: { id },
      data: {
        name: input.name?.trim() || undefined,
        description: input.description?.trim(),
        capacity: input.capacity,
        feePaise: input.feeRupees !== undefined ? rupeesToPaise(input.feeRupees) : undefined,
        depositPaise:
          input.depositRupees !== undefined ? rupeesToPaise(input.depositRupees) : undefined,
        slotMinutes: input.slotMinutes,
        advanceBookingDays: input.advanceBookingDays,
        active: input.active,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'amenity.update',
      entityType: 'Amenity',
      entityId: id,
      before: { name: existing.name },
      after: { name: amenity.name, active: amenity.active },
    });
    return this.mapAmenity(amenity);
  }

  async removeAmenity(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.amenity.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Amenity not found' });
    }
    const amenity = await this.prisma.amenity.update({
      where: { id },
      data: { active: false },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'amenity.delete',
      entityType: 'Amenity',
      entityId: id,
      before: { name: existing.name },
    });
    return this.mapAmenity(amenity);
  }

  async listBookings(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const staff = user.permissions.includes('booking.manage');
    const rows = await this.prisma.amenityBooking.findMany({
      where: {
        societyId,
        ...(staff ? {} : { bookedByUserId: user.id }),
      },
      orderBy: { startAt: 'desc' },
      take: 100,
    });
    return rows.map((b) => this.mapBooking(b));
  }

  async createBooking(
    user: AuthUser,
    input: {
      amenityId: string;
      startAt: string;
      endAt: string;
      unitId?: string;
      notes?: string;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      throw new BadRequestException({
        error: 'INVALID_RANGE',
        message: 'endAt must be after startAt',
      });
    }

    const amenity = await this.prisma.amenity.findFirst({
      where: { id: input.amenityId, societyId, active: true },
    });
    if (!amenity) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Amenity not found' });
    }

    const maxAdvanceMs = amenity.advanceBookingDays * 24 * 60 * 60 * 1000;
    if (startAt.getTime() - Date.now() > maxAdvanceMs) {
      throw new BadRequestException({
        error: 'ADVANCE_LIMIT',
        message: `Cannot book more than ${amenity.advanceBookingDays} days ahead`,
      });
    }

    if (input.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: input.unitId, societyId },
      });
      if (!unit) {
        throw new BadRequestException({ error: 'INVALID_UNIT', message: 'Unit not found' });
      }
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const overlapping = await tx.amenityBooking.findMany({
        where: {
          societyId,
          amenityId: amenity.id,
          status: { in: ['REQUESTED', 'CONFIRMED'] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        take: amenity.capacity,
      });
      if (overlapping.length >= amenity.capacity) {
        throw new BadRequestException({
          error: 'SLOT_UNAVAILABLE',
          message: 'Amenity is fully booked for this time range',
        });
      }

      return tx.amenityBooking.create({
        data: {
          societyId,
          amenityId: amenity.id,
          unitId: input.unitId,
          bookedByUserId: user.id,
          startAt,
          endAt,
          status: 'CONFIRMED',
          feePaise: amenity.feePaise,
          depositPaise: amenity.depositPaise,
          notes: input.notes?.trim() || undefined,
        },
      });
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'booking.create',
      entityType: 'AmenityBooking',
      entityId: booking.id,
      after: { amenityId: amenity.id, status: booking.status },
    });

    return this.mapBooking(booking);
  }

  async cancelBooking(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.amenityBooking.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Booking not found' });
    }
    if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
      throw new BadRequestException({
        error: 'INVALID_STATUS',
        message: `Cannot cancel a ${existing.status} booking`,
      });
    }
    const booking = await this.prisma.amenityBooking.update({
      where: { id },
      data: { status: 'CANCELLED' satisfies BookingStatus },
    });
    return this.mapBooking(booking);
  }

  async completeBooking(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.amenityBooking.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Booking not found' });
    }
    if (existing.status !== 'CONFIRMED' && existing.status !== 'REQUESTED') {
      throw new BadRequestException({
        error: 'INVALID_STATUS',
        message: `Cannot complete a ${existing.status} booking`,
      });
    }
    const booking = await this.prisma.amenityBooking.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    return this.mapBooking(booking);
  }

  async listHousehold(user: AuthUser, unitId?: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const staff = this.societies.isSocietyStaff(user);
    const scopedUnits = staff ? null : await this.societies.unitIdsForUser(user);
    return this.prisma.householdMember.findMany({
      where: {
        societyId,
        active: true,
        ...(unitId ? { unitId } : {}),
        ...(scopedUnits ? { unitId: { in: scopedUnits } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async createHouseholdMember(
    user: AuthUser,
    input: { unitId: string; name: string; relation?: string; mobile?: string },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const unit = await this.prisma.unit.findFirst({
      where: { id: input.unitId, societyId },
    });
    if (!unit) {
      throw new BadRequestException({ error: 'INVALID_UNIT', message: 'Unit not found' });
    }
    return this.prisma.householdMember.create({
      data: {
        societyId,
        unitId: input.unitId,
        name: input.name.trim(),
        relation: (input.relation?.trim() || 'FAMILY').toUpperCase(),
        mobile: input.mobile?.trim() || undefined,
      },
    });
  }

  async updateHouseholdMember(
    user: AuthUser,
    id: string,
    input: {
      unitId?: string;
      name?: string;
      relation?: string;
      mobile?: string;
      active?: boolean;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.householdMember.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Household member not found' });
    }
    if (input.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: input.unitId, societyId },
      });
      if (!unit) {
        throw new BadRequestException({ error: 'INVALID_UNIT', message: 'Unit not found' });
      }
    }
    return this.prisma.householdMember.update({
      where: { id },
      data: {
        unitId: input.unitId,
        name: input.name?.trim() || undefined,
        relation: input.relation?.trim()?.toUpperCase() || undefined,
        mobile: input.mobile?.trim(),
        active: input.active,
      },
    });
  }

  async removeHouseholdMember(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.householdMember.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Household member not found' });
    }
    await this.prisma.householdMember.update({ where: { id }, data: { active: false } });
    return { ok: true };
  }

  async listServicePersonnel(user: AuthUser, q?: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const rows = await this.prisma.servicePersonnel.findMany({
      where: { societyId },
      include: { units: true },
      orderBy: { name: 'asc' },
      take: 100,
    });
    const query = q?.trim().toLowerCase();
    const filtered = query
      ? rows.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.mobile.includes(query) ||
            p.serviceType.toLowerCase().includes(query),
        )
      : rows;
    return filtered.map((p) => ({
      ...p,
      unitIds: p.units.map((u) => u.unitId),
    }));
  }

  async createServicePersonnel(
    user: AuthUser,
    input: {
      name: string;
      mobile: string;
      serviceType: string;
      notes?: string;
      unitIds?: string[];
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const unitIds = [...new Set(input.unitIds ?? [])];
    for (const unitId of unitIds) {
      const unit = await this.prisma.unit.findFirst({ where: { id: unitId, societyId } });
      if (!unit) {
        throw new BadRequestException({ error: 'INVALID_UNIT', message: `Unit ${unitId} not found` });
      }
    }

    const personnel = await this.prisma.servicePersonnel.create({
      data: {
        societyId,
        name: input.name.trim(),
        mobile: input.mobile.trim(),
        serviceType: input.serviceType.trim().toUpperCase(),
        notes: input.notes?.trim() || undefined,
        units: {
          create: unitIds.map((unitId) => ({ societyId, unitId })),
        },
      },
      include: { units: true },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'service.create',
      entityType: 'ServicePersonnel',
      entityId: personnel.id,
      after: { name: personnel.name, serviceType: personnel.serviceType },
    });

    return {
      ...personnel,
      unitIds: personnel.units.map((u) => u.unitId),
    };
  }

  async updateServicePersonnel(
    user: AuthUser,
    id: string,
    input: {
      name?: string;
      mobile?: string;
      serviceType?: string;
      notes?: string;
      status?: string;
      unitIds?: string[];
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.servicePersonnel.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Service personnel not found' });
    }

    if (input.unitIds) {
      const unitIds = [...new Set(input.unitIds)];
      for (const unitId of unitIds) {
        const unit = await this.prisma.unit.findFirst({ where: { id: unitId, societyId } });
        if (!unit) {
          throw new BadRequestException({
            error: 'INVALID_UNIT',
            message: `Unit ${unitId} not found`,
          });
        }
      }
      await this.prisma.servicePersonnelUnit.deleteMany({ where: { personnelId: id } });
      if (unitIds.length) {
        await Promise.all(
          unitIds.map((unitId) =>
            this.prisma.servicePersonnelUnit.create({
              data: { societyId, personnelId: id, unitId },
            }),
          ),
        );
      }
    }

    const personnel = await this.prisma.servicePersonnel.update({
      where: { id },
      data: {
        name: input.name?.trim() || undefined,
        mobile: input.mobile?.trim() || undefined,
        serviceType: input.serviceType?.trim()?.toUpperCase() || undefined,
        notes: input.notes?.trim(),
        status: input.status?.trim()?.toUpperCase() || undefined,
      },
      include: { units: true },
    });

    return {
      ...personnel,
      unitIds: personnel.units.map((u) => u.unitId),
    };
  }

  async removeServicePersonnel(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.servicePersonnel.findFirst({
      where: { id, societyId },
    });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Service personnel not found' });
    }
    await this.prisma.servicePersonnelUnit.deleteMany({ where: { personnelId: id } });
    await this.prisma.servicePersonnel.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'service.delete',
      entityType: 'ServicePersonnel',
      entityId: id,
      before: { name: existing.name },
    });
    return { ok: true };
  }

  async linkServiceUnit(user: AuthUser, personnelId: string, unitId: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const personnel = await this.prisma.servicePersonnel.findFirst({
      where: { id: personnelId, societyId },
    });
    if (!personnel) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Service personnel not found' });
    }
    const unit = await this.prisma.unit.findFirst({ where: { id: unitId, societyId } });
    if (!unit) {
      throw new BadRequestException({ error: 'INVALID_UNIT', message: 'Unit not found' });
    }
    return this.prisma.servicePersonnelUnit.create({
      data: { societyId, personnelId, unitId },
    });
  }

  private mapAmenity(a: {
    id: string;
    societyId: string;
    name: string;
    description: string | null;
    capacity: number;
    feePaise: number;
    depositPaise: number;
    slotMinutes: number;
    advanceBookingDays: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...a,
      fee: paiseToRupees(a.feePaise),
      deposit: paiseToRupees(a.depositPaise),
    };
  }

  private mapBooking(b: {
    id: string;
    societyId: string;
    amenityId: string;
    unitId: string | null;
    bookedByUserId: string;
    startAt: Date;
    endAt: Date;
    status: BookingStatus;
    feePaise: number;
    depositPaise: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...b,
      fee: paiseToRupees(b.feePaise),
      deposit: paiseToRupees(b.depositPaise),
    };
  }
}
