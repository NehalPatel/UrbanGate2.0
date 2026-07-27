import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './documents.dto';

@Controller('documents')
@UseGuards(AuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermissions('document.view')
  list(@CurrentUser() user: AuthUser) {
    return this.documents.list(user);
  }

  @Post()
  @RequirePermissions('document.manage')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateDocumentDto) {
    return this.documents.create(user, body);
  }

  @Patch(':id')
  @RequirePermissions('document.manage')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.documents.update(user, id, body);
  }

  @Delete(':id')
  @RequirePermissions('document.manage')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.documents.remove(user, id);
  }
}
