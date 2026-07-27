import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { SocietiesModule } from '../societies/societies.module';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';

@Module({
  imports: [AuthModule, AuditModule, SocietiesModule],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
