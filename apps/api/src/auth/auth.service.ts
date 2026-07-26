import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { permissionsForRoles, type Permission } from '@urbangate/permissions';
import { loadEnv } from '@urbangate/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from './auth.types';
import type { Response } from 'express';

export const SESSION_COOKIE = 'ug_session';
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private cookieOptions() {
    const env = loadEnv();
    return {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SESSION_TTL_MS,
    };
  }

  setSessionCookie(res: Response, token: string) {
    res.cookie(SESSION_COOKIE, token, this.cookieOptions());
  }

  clearSessionCookie(res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  async register(input: { email: string; password: string; name: string }) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({
        error: 'EMAIL_IN_USE',
        message: 'An account with this email already exists',
      });
    }

    const userCount = await this.prisma.user.count();
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash,
        isPlatformAdmin: userCount === 0,
        status: 'ACTIVE',
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'user.register',
      entityType: 'User',
      entityId: user.id,
      after: { email: user.email, isPlatformAdmin: user.isPlatformAdmin },
    });

    return this.toPublicUser(user);
  }

  async login(input: { email: string; password: string }, meta?: { ip?: string; userAgent?: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        error: 'ACCOUNT_DISABLED',
        message: 'Account is not active',
      });
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const memberships = await this.prisma.societyMembership.findMany({
      where: { userId: user.id, status: 'active' },
      include: { society: true },
      orderBy: { createdAt: 'asc' },
    });

    const token = randomBytes(32).toString('hex');
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        activeSocietyId: memberships[0]?.societyId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId: session.activeSocietyId,
      action: 'user.login',
      entityType: 'Session',
      entityId: session.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { token, user: await this.buildAuthUser(user.id, session.id, session.activeSocietyId) };
  }

  async logout(token: string | undefined, userId?: string) {
    if (!token) return;
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });
    if (session && !session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      await this.audit.record({
        actorUserId: userId ?? session.userId,
        societyId: session.activeSocietyId,
        action: 'user.logout',
        entityType: 'Session',
        entityId: session.id,
      });
    }
  }

  async resolveSession(token: string): Promise<AuthUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      return null;
    }
    return this.buildAuthUser(session.userId, session.id, session.activeSocietyId);
  }

  async switchSociety(user: AuthUser, societyId: string) {
    const membership = user.memberships.find((m) => m.societyId === societyId);
    if (!membership && !user.isPlatformAdmin) {
      throw new BadRequestException({
        error: 'NOT_A_MEMBER',
        message: 'You are not a member of this society',
      });
    }

    await this.prisma.session.update({
      where: { id: user.sessionId },
      data: { activeSocietyId: societyId },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'session.switch_society',
      entityType: 'Session',
      entityId: user.sessionId,
      after: { activeSocietyId: societyId },
    });

    return this.buildAuthUser(user.id, user.sessionId, societyId);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string;
    status: string;
    isPlatformAdmin: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      isPlatformAdmin: user.isPlatformAdmin,
    };
  }

  private async buildAuthUser(
    userId: string,
    sessionId: string,
    activeSocietyId: string | null,
  ): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const memberships = await this.prisma.societyMembership.findMany({
      where: { userId, status: 'active' },
      include: { society: true },
      orderBy: { createdAt: 'asc' },
    });

    const active = memberships.find((m) => m.societyId === activeSocietyId) ?? memberships[0];
    const roleKeys = user.isPlatformAdmin
      ? ['PLATFORM_ADMIN', ...(active?.roleKeys ?? [])]
      : (active?.roleKeys ?? []);
    const permissions = [...permissionsForRoles(roleKeys)] as Permission[];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      isPlatformAdmin: user.isPlatformAdmin,
      sessionId,
      activeSocietyId: active?.societyId ?? null,
      memberships: memberships.map((m) => ({
        id: m.id,
        societyId: m.societyId,
        roleKeys: m.roleKeys,
        society: {
          id: m.society.id,
          name: m.society.name,
          slug: m.society.slug,
        },
      })),
      permissions,
    };
  }
}
