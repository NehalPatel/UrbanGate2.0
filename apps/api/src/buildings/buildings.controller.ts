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
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto, UpdateBuildingDto } from './buildings.dto';

@Controller('buildings')
@UseGuards(AuthGuard, PermissionsGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @RequirePermissions('building.view')
  list(@CurrentUser() user: AuthUser) {
    return this.buildingsService.list(user);
  }

  @Post()
  @RequirePermissions('building.create')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateBuildingDto) {
    return this.buildingsService.create(user, body);
  }

  @Patch(':id')
  @RequirePermissions('building.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateBuildingDto) {
    return this.buildingsService.update(user, id, body);
  }

  @Delete(':id')
  @RequirePermissions('building.delete')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.buildingsService.remove(user, id);
  }
}
