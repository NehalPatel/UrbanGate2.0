import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { SocietiesModule } from '../societies/societies.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, SocietiesModule],
  controllers: [BuildingsController],
  providers: [BuildingsService],
})
export class BuildingsModule {}
