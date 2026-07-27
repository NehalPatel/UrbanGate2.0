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
import type { ComplaintPriority, ComplaintStatus } from '@urbangate/database';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { ComplaintsService, MeetingsService, NoticesService } from './community.service';
import {
  CompleteMeetingDto,
  CreateComplaintDto,
  CreateMeetingDto,
  CreateNoticeDto,
  UpdateComplaintStatusDto,
  UpdateMeetingDto,
  UpdateNoticeDto,
} from './community.dto';

@Controller('notices')
@UseGuards(AuthGuard, PermissionsGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @RequirePermissions('notice.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.noticesService.list(user);
  }

  @Post()
  @RequirePermissions('notice.create')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateNoticeDto): Promise<unknown> {
    return this.noticesService.create(user, body);
  }

  @Patch(':id')
  @RequirePermissions('notice.create')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateNoticeDto,
  ): Promise<unknown> {
    return this.noticesService.update(user, id, body);
  }

  @Delete(':id')
  @RequirePermissions('notice.publish')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.noticesService.remove(user, id);
  }

  @Post(':id/publish')
  @RequirePermissions('notice.publish')
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.noticesService.publish(user, id);
  }

  @Post(':id/archive')
  @RequirePermissions('notice.publish')
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.noticesService.archive(user, id);
  }
}

@Controller('complaints')
@UseGuards(AuthGuard, PermissionsGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @RequirePermissions('complaint.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.complaintsService.list(user);
  }

  @Post()
  @RequirePermissions('complaint.create')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateComplaintDto): Promise<unknown> {
    return this.complaintsService.create(user, {
      ...body,
      priority: body.priority as ComplaintPriority | undefined,
    });
  }

  @Patch(':id/status')
  @RequirePermissions('complaint.assign')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateComplaintStatusDto,
  ): Promise<unknown> {
    return this.complaintsService.updateStatus(user, id, {
      status: body.status as ComplaintStatus,
      assignedToUserId: body.assignedToUserId,
    });
  }
}

@Controller('meetings')
@UseGuards(AuthGuard, PermissionsGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @RequirePermissions('meeting.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.meetingsService.list(user);
  }

  @Post()
  @RequirePermissions('meeting.create')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateMeetingDto): Promise<unknown> {
    return this.meetingsService.create(user, body);
  }

  @Patch(':id')
  @RequirePermissions('meeting.update')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateMeetingDto,
  ): Promise<unknown> {
    return this.meetingsService.update(user, id, body);
  }

  @Delete(':id')
  @RequirePermissions('meeting.update')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.meetingsService.remove(user, id);
  }

  @Post(':id/schedule')
  @RequirePermissions('meeting.update')
  schedule(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.meetingsService.schedule(user, id);
  }

  @Post(':id/complete')
  @RequirePermissions('meeting.complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CompleteMeetingDto,
  ): Promise<unknown> {
    return this.meetingsService.complete(user, id, body);
  }

  @Post(':id/cancel')
  @RequirePermissions('meeting.update')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.meetingsService.cancel(user, id);
  }
}
