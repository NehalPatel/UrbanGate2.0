import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ComplaintPriority,
  ComplaintStatus,
  MeetingStatus,
  NoticeStatus,
} from '@urbangate/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const canManage = user.permissions.includes('notice.publish');
    return this.prisma.notice.findMany({
      where: {
        societyId,
        ...(canManage ? {} : { status: 'PUBLISHED' }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    user: AuthUser,
    input: { title: string; body: string; audience?: string; publish?: boolean },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const publish = Boolean(input.publish);
    const notice = await this.prisma.notice.create({
      data: {
        societyId,
        title: input.title.trim(),
        body: input.body.trim(),
        audience: input.audience?.trim() || 'SOCIETY',
        status: publish ? 'PUBLISHED' : 'DRAFT',
        createdByUserId: user.id,
        publishedAt: publish ? new Date() : undefined,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'notice.create',
      entityType: 'Notice',
      entityId: notice.id,
      after: { title: notice.title, status: notice.status },
    });
    if (publish) {
      const memberIds = await this.notifications.societyMemberUserIds(societyId);
      await this.notifications.notifyMany({
        societyId,
        userIds: memberIds.filter((uid) => uid !== user.id),
        type: 'notice.published',
        title: `Notice: ${notice.title}`,
        body: notice.body.slice(0, 280),
        entityType: 'Notice',
        entityId: notice.id,
        email: true,
      });
    }
    return notice;
  }

  async publish(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.notice.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Notice not found' });
    }
    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        status: 'PUBLISHED' satisfies NoticeStatus,
        publishedAt: new Date(),
        archivedAt: null,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'notice.publish',
      entityType: 'Notice',
      entityId: id,
    });

    const memberIds = await this.notifications.societyMemberUserIds(societyId);
    await this.notifications.notifyMany({
      societyId,
      userIds: memberIds.filter((uid) => uid !== user.id),
      type: 'notice.published',
      title: `Notice: ${notice.title}`,
      body: notice.body.slice(0, 280),
      entityType: 'Notice',
      entityId: notice.id,
      email: true,
    });

    return notice;
  }

  async archive(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.notice.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Notice not found' });
    }
    return this.prisma.notice.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  async update(
    user: AuthUser,
    id: string,
    input: { title?: string; body?: string; audience?: string },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.notice.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Notice not found' });
    }
    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        title: input.title?.trim() || undefined,
        body: input.body?.trim() || undefined,
        audience: input.audience?.trim() || undefined,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'notice.update',
      entityType: 'Notice',
      entityId: id,
      before: { title: existing.title },
      after: { title: notice.title },
    });
    return notice;
  }

  async remove(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.notice.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Notice not found' });
    }
    await this.prisma.notice.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'notice.delete',
      entityType: 'Notice',
      entityId: id,
      before: { title: existing.title },
    });
    return { ok: true };
  }
}

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const canAssign = user.permissions.includes('complaint.assign');
    if (canAssign) {
      return this.prisma.complaint.findMany({
        where: { societyId },
        orderBy: { createdAt: 'desc' },
      });
    }
    const unitIds = await this.societies.unitIdsForUser(user);
    return this.prisma.complaint.findMany({
      where: {
        societyId,
        OR: [{ createdByUserId: user.id }, ...(unitIds.length ? [{ unitId: { in: unitIds } }] : [])],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    user: AuthUser,
    input: {
      category: string;
      subject: string;
      description: string;
      priority?: ComplaintPriority;
      unitId?: string;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    if (input.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: input.unitId, societyId },
      });
      if (!unit) {
        throw new BadRequestException({
          error: 'INVALID_UNIT',
          message: 'Unit not found in active society',
        });
      }
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        societyId,
        unitId: input.unitId,
        category: input.category.trim(),
        subject: input.subject.trim(),
        description: input.description.trim(),
        priority: input.priority ?? 'MEDIUM',
        status: 'OPEN',
        createdByUserId: user.id,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'complaint.create',
      entityType: 'Complaint',
      entityId: complaint.id,
      after: { subject: complaint.subject, status: complaint.status },
    });

    return complaint;
  }

  async updateStatus(
    user: AuthUser,
    id: string,
    input: { status: ComplaintStatus; assignedToUserId?: string },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.complaint.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Complaint not found' });
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: input.status,
        assignedToUserId: input.assignedToUserId,
        resolvedAt:
          input.status === 'RESOLVED' || input.status === 'CLOSED' ? new Date() : undefined,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'complaint.status',
      entityType: 'Complaint',
      entityId: id,
      before: { status: existing.status },
      after: { status: complaint.status },
    });

    const recipients = [existing.createdByUserId, complaint.assignedToUserId].filter(
      (uid): uid is string => Boolean(uid) && uid !== user.id,
    );
    await this.notifications.notifyMany({
      societyId,
      userIds: recipients,
      type: 'complaint.status',
      title: `Complaint update: ${complaint.subject}`,
      body: `Status changed to ${complaint.status}`,
      entityType: 'Complaint',
      entityId: complaint.id,
      email: true,
    });

    return complaint;
  }
}

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.meeting.findMany({
      where: { societyId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async create(
    user: AuthUser,
    input: {
      title: string;
      agenda: string;
      scheduledAt: string;
      description?: string;
      location?: string;
      onlineLink?: string;
      audience?: string;
      schedule?: boolean;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException({
        error: 'INVALID_DATETIME',
        message: 'scheduledAt must be a valid ISO date-time',
      });
    }

    const schedule = input.schedule !== false;
    const status: MeetingStatus = schedule ? 'SCHEDULED' : 'DRAFT';

    const meeting = await this.prisma.meeting.create({
      data: {
        societyId,
        title: input.title.trim(),
        agenda: input.agenda.trim(),
        description: input.description?.trim() || undefined,
        scheduledAt,
        location: input.location?.trim() || undefined,
        onlineLink: input.onlineLink?.trim() || undefined,
        audience: input.audience?.trim() || 'SOCIETY',
        status,
        createdByUserId: user.id,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'meeting.create',
      entityType: 'Meeting',
      entityId: meeting.id,
      after: { title: meeting.title, status: meeting.status },
    });

    return meeting;
  }

  async schedule(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.meeting.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Meeting not found' });
    }
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestException({
        error: 'INVALID_STATUS',
        message: 'Cannot schedule a completed or cancelled meeting',
      });
    }

    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: { status: 'SCHEDULED', cancelledAt: null },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'meeting.schedule',
      entityType: 'Meeting',
      entityId: id,
    });

    return meeting;
  }

  async complete(user: AuthUser, id: string, input: { minutes?: string }) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.meeting.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Meeting not found' });
    }
    if (existing.status === 'CANCELLED') {
      throw new BadRequestException({
        error: 'INVALID_STATUS',
        message: 'Cannot complete a cancelled meeting',
      });
    }

    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        minutes: input.minutes?.trim() || existing.minutes,
        completedAt: new Date(),
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'meeting.complete',
      entityType: 'Meeting',
      entityId: id,
    });

    return meeting;
  }

  async cancel(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.meeting.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Meeting not found' });
    }
    if (existing.status === 'COMPLETED') {
      throw new BadRequestException({
        error: 'INVALID_STATUS',
        message: 'Cannot cancel a completed meeting',
      });
    }

    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'meeting.cancel',
      entityType: 'Meeting',
      entityId: id,
    });

    return meeting;
  }

  async update(
    user: AuthUser,
    id: string,
    input: {
      title?: string;
      agenda?: string;
      scheduledAt?: string;
      description?: string;
      location?: string;
      onlineLink?: string;
      audience?: string;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.meeting.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Meeting not found' });
    }
    let scheduledAt: Date | undefined;
    if (input.scheduledAt) {
      scheduledAt = new Date(input.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new BadRequestException({
          error: 'INVALID_DATETIME',
          message: 'scheduledAt must be a valid ISO date-time',
        });
      }
    }
    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: {
        title: input.title?.trim() || undefined,
        agenda: input.agenda?.trim() || undefined,
        scheduledAt,
        description: input.description?.trim(),
        location: input.location?.trim(),
        onlineLink: input.onlineLink?.trim(),
        audience: input.audience?.trim() || undefined,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'meeting.update',
      entityType: 'Meeting',
      entityId: id,
      before: { title: existing.title },
      after: { title: meeting.title },
    });
    return meeting;
  }

  async remove(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.meeting.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Meeting not found' });
    }
    await this.prisma.meeting.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'meeting.delete',
      entityType: 'Meeting',
      entityId: id,
      before: { title: existing.title },
    });
    return { ok: true };
  }
}
