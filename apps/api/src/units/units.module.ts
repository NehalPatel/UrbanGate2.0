import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { SocietiesModule } from '../societies/societies.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, SocietiesModule],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
