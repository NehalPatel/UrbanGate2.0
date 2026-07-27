import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SocietiesService } from '../societies/societies.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly societies: SocietiesService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
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
    input: { email: string; name: string; roleKeys: string[]; temporaryPassword?: string },
  ): Promise<unknown> {
    const societyId = this.societies.requireActiveSociety(user);
    const email = input.email.trim().toLowerCase();
    let memberUser = await this.prisma.user.findUnique({ where: { email } });
    let temporaryPassword: string | undefined;

    if (!memberUser) {
      const argon2 = await import('argon2');
      temporaryPassword =
        input.temporaryPassword?.trim() ||
        `Ug-${randomBytes(4).toString('hex')}!`;
      memberUser = await this.prisma.user.create({
        data: {
          email,
          name: input.name.trim(),
          passwordHash: await argon2.hash(temporaryPassword, { type: argon2.argon2id }),
          status: 'ACTIVE',
        },
      });

      await this.email.send({
        to: email,
        subject: 'You are invited to UrbanGate',
        text: `Hi ${input.name.trim()},\n\nYou have been invited to UrbanGate.\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nSign in at the resident portal and change your password when that flow is available.`,
      });
    } else if (memberUser.status === 'INVITED') {
      // Reactivate stuck invites from earlier builds so the member can sign in.
      const argon2 = await import('argon2');
      temporaryPassword =
        input.temporaryPassword?.trim() ||
        `Ug-${randomBytes(4).toString('hex')}!`;
      memberUser = await this.prisma.user.update({
        where: { id: memberUser.id },
        data: {
          name: input.name.trim() || memberUser.name,
          passwordHash: await argon2.hash(temporaryPassword, { type: argon2.argon2id }),
          status: 'ACTIVE',
        },
      });
      await this.email.send({
        to: email,
        subject: 'Your UrbanGate account is ready',
        text: `Hi ${memberUser.name},\n\nYour UrbanGate login is ready.\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n`,
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

    return {
      ...membership,
      temporaryPassword,
    };
  }
}
