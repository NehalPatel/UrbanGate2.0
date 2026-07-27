import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SocietiesService } from '../societies/societies.service';
import type { AuthUser } from '../auth/auth.types';

export type NotifyInput = {
  societyId: string;
  userIds: string[];
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  email?: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly societies: SocietiesService,
  ) {}

  async listMine(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.notification.findMany({
      where: { userId: user.id, societyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId: user.id, societyId },
    });
    if (!existing) {
      return null;
    }
    if (existing.readAt) return existing;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    await this.prisma.notification.updateMany({
      where: { userId: user.id, societyId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  /** Fan-out in-app (+ optional console email). Sync for MVP; queue later. */
  async notifyMany(input: NotifyInput) {
    const uniqueIds = [...new Set(input.userIds.filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    const rows = await Promise.all(
      uniqueIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            societyId: input.societyId,
            userId,
            channel: 'IN_APP',
            type: input.type,
            title: input.title,
            body: input.body,
            entityType: input.entityType,
            entityId: input.entityId,
          },
        }),
      ),
    );

    if (input.email) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, email: true },
      });
      await Promise.all(
        users.map(async (u) => {
          await this.email.send({
            to: u.email,
            subject: input.title,
            text: input.body,
          });
          const row = rows.find((r) => r.userId === u.id);
          if (row) {
            await this.prisma.notification.update({
              where: { id: row.id },
              data: { emailedAt: new Date(), channel: 'IN_APP+EMAIL' },
            });
          }
        }),
      );
    }

    return rows;
  }

  async societyMemberUserIds(societyId: string): Promise<string[]> {
    const members = await this.prisma.societyMembership.findMany({
      where: { societyId, status: 'active' },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }
}
