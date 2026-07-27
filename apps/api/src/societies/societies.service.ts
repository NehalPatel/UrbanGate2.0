import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/auth.types';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

@Injectable()
export class SocietiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, input: { name: string; timezone?: string }) {
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException({ error: 'INVALID_NAME', message: 'Name is required' });
    }

    let slug = slugify(name) || `society-${Date.now()}`;
    const existing = await this.prisma.society.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const society = await this.prisma.society.create({
      data: {
        name,
        slug,
        timezone: input.timezone ?? 'Asia/Kolkata',
        memberships: {
          create: {
            userId: user.id,
            roleKeys: ['SOCIETY_ADMIN'],
            status: 'active',
          },
        },
      },
    });

    await this.prisma.session.update({
      where: { id: user.sessionId },
      data: { activeSocietyId: society.id },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId: society.id,
      action: 'society.create',
      entityType: 'Society',
      entityId: society.id,
      after: { name: society.name, slug: society.slug },
    });

    return society;
  }

  async listForUser(user: AuthUser) {
    if (user.isPlatformAdmin) {
      return this.prisma.society.findMany({ orderBy: { createdAt: 'desc' } });
    }
    const memberships = await this.prisma.societyMembership.findMany({
      where: { userId: user.id, status: 'active' },
      include: { society: true },
    });
    return memberships.map((m) => m.society);
  }

  async get(user: AuthUser, societyId: string) {
    this.assertSocietyAccess(user, societyId);
    const society = await this.prisma.society.findUnique({ where: { id: societyId } });
    if (!society) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Society not found' });
    }
    return society;
  }

  async update(
    user: AuthUser,
    societyId: string,
    input: { name?: string; timezone?: string; locale?: string },
  ) {
    this.assertSocietyAccess(user, societyId);
    const before = await this.get(user, societyId);
    const society = await this.prisma.society.update({
      where: { id: societyId },
      data: {
        name: input.name?.trim() || undefined,
        timezone: input.timezone,
        locale: input.locale,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'society.update',
      entityType: 'Society',
      entityId: societyId,
      before: { name: before.name, timezone: before.timezone },
      after: { name: society.name, timezone: society.timezone },
    });
    return society;
  }

  assertSocietyAccess(user: AuthUser, societyId: string) {
    if (user.isPlatformAdmin) return;
    const ok = user.memberships.some((m) => m.societyId === societyId);
    if (!ok) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Society not found' });
    }
  }

  requireActiveSociety(user: AuthUser): string {
    if (!user.activeSocietyId) {
      throw new BadRequestException({
        error: 'NO_ACTIVE_SOCIETY',
        message: 'Select or create a society first',
      });
    }
    this.assertSocietyAccess(user, user.activeSocietyId);
    return user.activeSocietyId;
  }

  /** Society staff see society-wide data; residents are scoped to linked units. */
  isSocietyStaff(user: AuthUser): boolean {
    if (user.isPlatformAdmin) return true;
    return (
      user.permissions.includes('invoice.create') ||
      user.permissions.includes('member.invite') ||
      user.permissions.includes('society.update') ||
      user.permissions.includes('gate.manage') ||
      user.permissions.includes('building.create')
    );
  }

  /** Gate ops and admins need society-wide unit lists; residents see linked units only. */
  shouldScopeToLinkedUnits(user: AuthUser): boolean {
    if (this.isSocietyStaff(user)) return false;
    if (user.permissions.includes('visitor.checkin')) return false;
    if (user.permissions.includes('member.view') && user.permissions.includes('complaint.assign')) {
      return false;
    }
    return true;
  }

  async unitIdsForUser(user: AuthUser): Promise<string[]> {
    const societyId = this.requireActiveSociety(user);
    const rels = await this.prisma.unitRelationship.findMany({
      where: { societyId, userId: user.id },
      select: { unitId: true },
    });
    return [...new Set(rels.map((r) => r.unitId))];
  }
}
