import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { SocietiesModule } from '../societies/societies.module';
import { GateController } from './gate.controller';
import { GateService } from './gate.service';

@Module({
  imports: [AuthModule, AuditModule, SocietiesModule],
  controllers: [GateController],
  providers: [GateService],
})
export class GateModule {}
