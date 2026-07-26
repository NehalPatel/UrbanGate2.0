import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { UnitsService } from './units.service';
import { AssignUnitRelationshipDto, CreateUnitDto, UpdateUnitDto } from './units.dto';

@Controller('units')
@UseGuards(AuthGuard, PermissionsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @RequirePermissions('unit.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.unitsService.list(user);
  }

  @Post('relationships')
  @RequirePermissions('member.update')
  assignRelationship(
    @CurrentUser() user: AuthUser,
    @Body() body: AssignUnitRelationshipDto,
  ): Promise<unknown> {
    return this.unitsService.assignRelationship(user, body);
  }

  @Post()
  @RequirePermissions('unit.create')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateUnitDto) {
    return this.unitsService.create(user, body);
  }

  @Patch(':id')
  @RequirePermissions('unit.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateUnitDto) {
    return this.unitsService.update(user, id, body);
  }
}
