import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SocietiesModule } from '../societies/societies.module';
import { EmailModule } from '../email/email.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule, SocietiesModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
