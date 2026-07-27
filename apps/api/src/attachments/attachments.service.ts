import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { extname } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SocietiesService } from '../societies/societies.service';
import { StorageService } from '../storage/storage.service';
import type { AuthUser } from '../auth/auth.types';
import { ATTACHMENT_ENTITY_TYPES, isAllowedAttachmentEntity } from './attachment.rules';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly societies: SocietiesService,
    private readonly storage: StorageService,
  ) {}

  async list(user: AuthUser, entityType: string, entityId: string) {
    const societyId = this.societies.requireActiveSociety(user);
    await this.assertEntity(societyId, entityType, entityId);
    return this.prisma.attachment.findMany({
      where: { societyId, entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(
    user: AuthUser,
    input: {
      entityType: string;
      entityId: string;
      originalName: string;
      mimeType: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    const societyId = this.societies.requireActiveSociety(user);
    if (!isAllowedAttachmentEntity(input.entityType)) {
      throw new BadRequestException({
        error: 'INVALID_ENTITY',
        message: `entityType must be one of ${ATTACHMENT_ENTITY_TYPES.join(', ')}`,
      });
    }
    if (input.size <= 0 || input.size > MAX_BYTES) {
      throw new BadRequestException({
        error: 'FILE_TOO_LARGE',
        message: `File must be between 1 byte and ${MAX_BYTES} bytes`,
      });
    }
    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw new BadRequestException({
        error: 'INVALID_MIME',
        message: 'MIME type not allowed',
      });
    }

    await this.assertEntity(societyId, input.entityType, input.entityId);

    const ext = extname(input.originalName).replace('.', '') || 'bin';
    const stored = await this.storage.put(societyId, input.entityType, input.buffer, ext);

    const attachment = await this.prisma.attachment.create({
      data: {
        societyId,
        entityType: input.entityType,
        entityId: input.entityId,
        originalName: input.originalName.slice(0, 200),
        storageKey: stored.storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.size,
        uploadedByUserId: user.id,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'attachment.create',
      entityType: 'Attachment',
      entityId: attachment.id,
      after: {
        entityType: attachment.entityType,
        entityId: attachment.entityId,
        originalName: attachment.originalName,
      },
    });

    return attachment;
  }

  async download(user: AuthUser, id: string): Promise<{ file: StreamableFile; name: string; mime: string }> {
    const societyId = this.societies.requireActiveSociety(user);
    const attachment = await this.prisma.attachment.findFirst({ where: { id, societyId } });
    if (!attachment) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Attachment not found' });
    }
    const buffer = await this.storage.get(attachment.storageKey);
    return {
      file: new StreamableFile(buffer),
      name: attachment.originalName,
      mime: attachment.mimeType,
    };
  }

  async remove(user: AuthUser, id: string) {
    const societyId = this.societies.requireActiveSociety(user);
    const attachment = await this.prisma.attachment.findFirst({ where: { id, societyId } });
    if (!attachment) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Attachment not found' });
    }
    await this.storage.delete(attachment.storageKey);
    await this.prisma.attachment.delete({ where: { id } });
    await this.audit.record({
      actorUserId: user.id,
      societyId,
      action: 'attachment.delete',
      entityType: 'Attachment',
      entityId: id,
    });
    return { ok: true };
  }

  private async assertEntity(societyId: string, entityType: string, entityId: string) {
    let ok = false;
    if (entityType === 'Notice') {
      ok = Boolean(await this.prisma.notice.findFirst({ where: { id: entityId, societyId } }));
    } else if (entityType === 'Complaint') {
      ok = Boolean(await this.prisma.complaint.findFirst({ where: { id: entityId, societyId } }));
    } else if (entityType === 'Meeting') {
      ok = Boolean(await this.prisma.meeting.findFirst({ where: { id: entityId, societyId } }));
    } else if (entityType === 'SocietyDocument') {
      ok = Boolean(
        await this.prisma.societyDocument.findFirst({ where: { id: entityId, societyId } }),
      );
    }
    if (!ok) {
      throw new BadRequestException({
        error: 'INVALID_ENTITY',
        message: 'Target entity not found in active society',
      });
    }
  }
}
