import { Module } from '@nestjs/common';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { SocietiesModule } from '../societies/societies.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, SocietiesModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
