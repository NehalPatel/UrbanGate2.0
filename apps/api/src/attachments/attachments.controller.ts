import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { AttachmentsService } from './attachments.service';

@Controller('attachments')
@UseGuards(AuthGuard, PermissionsGuard)
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get()
  @RequirePermissions('attachment.view')
  list(
    @CurrentUser() user: AuthUser,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ): Promise<unknown> {
    if (!entityType || !entityId) {
      throw new BadRequestException({
        error: 'VALIDATION',
        message: 'entityType and entityId are required',
      });
    }
    return this.attachments.list(user, entityType, entityId);
  }

  @Post()
  @RequirePermissions('attachment.create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<unknown> {
    if (!entityType || !entityId) {
      throw new BadRequestException({
        error: 'VALIDATION',
        message: 'entityType and entityId are required',
      });
    }
    if (!file) {
      throw new BadRequestException({ error: 'VALIDATION', message: 'file is required' });
    }
    return this.attachments.upload(user, {
      entityType,
      entityId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });
  }

  @Get(':id/download')
  @RequirePermissions('attachment.view')
  async download(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { file, name, mime } = await this.attachments.download(user, id);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
    return file;
  }

  @Delete(':id')
  @RequirePermissions('attachment.delete')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.attachments.remove(user, id);
  }
}
