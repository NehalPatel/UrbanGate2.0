import { Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermissions('notification.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.notifications.listMine(user);
  }

  @Post('read-all')
  @RequirePermissions('notification.view')
  markAll(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.notifications.markAllRead(user);
  }

  @Post(':id/read')
  @RequirePermissions('notification.view')
  async markOne(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    const row = await this.notifications.markRead(user, id);
    if (!row) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Notification not found' });
    }
    return row;
  }
}
