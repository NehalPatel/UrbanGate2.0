import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocietiesService } from '../societies/societies.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly societies: SocietiesService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthUser): Promise<unknown> {
    const societyId = this.societies.requireActiveSociety(user);
    return this.prisma.societyMembership.findMany({
      where: { societyId },
      include: {
        user: { select: { id: true, email: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async invite(
    user: AuthUser,
    input: { email: string; name: string; roleKeys: string[] },
  ): Promise<unknown> {
    const societyId = this.societies.requireActiveSociety(user);
    const email = input.email.trim().toLowerCase();
    let memberUser = await this.prisma.user.findUnique({ where: { email } });
    if (!memberUser) {
      // Invite placeholder account — password set later via reset (MVP-1 stub uses random hash)
      const argon2 = await import('argon2');
      memberUser = await this.prisma.user.create({
        data: {
          email,
          name: input.name.trim(),
          passwordHash: await argon2.hash(`invite-${Date.now()}`, { type: argon2.argon2id }),
          status: 'INVITED',
        },
      });
    }

    const membership = await this.prisma.societyMembership.upsert({
      where: {
        societyId_userId: { societyId, userId: memberUser.id },
      },
      create: {
        societyId,
        userId: memberUser.id,
        roleKeys: input.roleKeys.length ? input.roleKeys : ['RESIDENT'],
        status: 'active',
      },
      update: {
        roleKeys: input.roleKeys.length ? input.roleKeys : undefined,
        status: 'active',
      },
      include: {
        user: { select: { id: true, email: true, name: true, status: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'member.invite',
      entityType: 'SocietyMembership',
      entityId: membership.id,
      after: { userId: memberUser.id, roleKeys: membership.roleKeys },
    });

    return membership;
  }
}
