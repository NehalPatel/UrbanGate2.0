import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class BuildingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.building.findMany({
      where: { societyId },
      orderBy: { name: 'asc' },
    });
  }

  async create(user: AuthUser, input: { name: string; code?: string }) {
    const societyId = this.societies.requireActiveSociety(user);
    const building = await this.prisma.building.create({
      data: {
        societyId,
        name: input.name.trim(),
        code: input.code?.trim() || undefined,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'building.create',
      entityType: 'Building',
      entityId: building.id,
      after: { name: building.name, code: building.code },
    });
    return building;
  }

  async update(user: AuthUser, id: string, input: { name?: string; code?: string }) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.building.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Building not found' });
    }
    const building = await this.prisma.building.update({
      where: { id },
      data: {
        name: input.name?.trim() || undefined,
        code: input.code?.trim(),
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'building.update',
      entityType: 'Building',
      entityId: id,
      before: { name: existing.name },
      after: { name: building.name },
    });
    return building;
  }

  async remove(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.building.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Building not found' });
    }
    await this.prisma.unit.deleteMany({ where: { buildingId: id, societyId } });
    await this.prisma.building.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'building.delete',
      entityType: 'Building',
      entityId: id,
      before: { name: existing.name },
    });
    return { ok: true };
  }
}
