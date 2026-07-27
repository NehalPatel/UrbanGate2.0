import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { SocietiesModule } from '../societies/societies.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  ComplaintsController,
  MeetingsController,
  NoticesController,
} from './community.controller';
import { ComplaintsService, MeetingsService, NoticesService } from './community.service';

@Module({
  imports: [AuthModule, AuditModule, SocietiesModule, NotificationsModule],
  controllers: [NoticesController, ComplaintsController, MeetingsController],
  providers: [NoticesService, ComplaintsService, MeetingsService],
})
export class CommunityModule {}
