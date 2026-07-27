import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import { StorageService } from '../storage/storage.service';
import type { AuthUser } from '../auth/auth.types';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
    private readonly storage: StorageService,
  ) {}

  async list(user: AuthUser) {
    const societyId = this.societies.requireActiveSociety(user);
    const canManage = user.permissions.includes('document.manage');
    const docs = await this.prisma.societyDocument.findMany({
      where: {
        societyId,
        ...(canManage ? {} : { published: true }),
      },
      orderBy: { createdAt: 'desc' },
    });

    const withFiles = await Promise.all(
      docs.map(async (doc) => {
        const files = await this.prisma.attachment.findMany({
          where: { societyId, entityType: 'SocietyDocument', entityId: doc.id },
          orderBy: { createdAt: 'desc' },
        });
        return { ...doc, files };
      }),
    );
    return withFiles;
  }

  async create(
    user: AuthUser,
    input: { title: string; category?: string; description?: string; published?: boolean },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const doc = await this.prisma.societyDocument.create({
      data: {
        societyId,
        title: input.title.trim(),
        category: (input.category?.trim() || 'GENERAL').toUpperCase(),
        description: input.description?.trim() || undefined,
        published: input.published !== false,
        createdByUserId: user.id,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'document.create',
      entityType: 'SocietyDocument',
      entityId: doc.id,
      after: { title: doc.title, category: doc.category },
    });
    return { ...doc, files: [] };
  }

  async update(
    user: AuthUser,
    id: string,
    input: { title?: string; category?: string; description?: string; published?: boolean },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.societyDocument.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Document not found' });
    }
    const doc = await this.prisma.societyDocument.update({
      where: { id },
      data: {
        title: input.title?.trim() || undefined,
        category: input.category?.trim()?.toUpperCase() || undefined,
        description: input.description?.trim(),
        published: input.published,
      },
    });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'document.update',
      entityType: 'SocietyDocument',
      entityId: id,
      before: { title: existing.title },
      after: { title: doc.title, published: doc.published },
    });
    return doc;
  }

  async remove(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const existing = await this.prisma.societyDocument.findFirst({ where: { id, societyId } });
    if (!existing) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Document not found' });
    }
    const files = await this.prisma.attachment.findMany({
      where: { societyId, entityType: 'SocietyDocument', entityId: id },
    });
    for (const file of files) {
      await this.storage.delete(file.storageKey);
      await this.prisma.attachment.delete({ where: { id: file.id } });
    }
    await this.prisma.societyDocument.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'document.delete',
      entityType: 'SocietyDocument',
      entityId: id,
      before: { title: existing.title },
    });
    return { ok: true };
  }
}
