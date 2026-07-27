import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { BillingFrequency } from '@urbangate/database';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRuleDto, UpdateMaintenanceRuleDto } from './maintenance.dto';

@Controller('maintenance-rules')
@UseGuards(AuthGuard, PermissionsGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @RequirePermissions('maintenance.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.maintenanceService.list(user);
  }

  @Post()
  @RequirePermissions('maintenance.manage')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateMaintenanceRuleDto): Promise<unknown> {
    return this.maintenanceService.create(user, {
      ...body,
      frequency: body.frequency as BillingFrequency | undefined,
    });
  }

  @Patch(':id')
  @RequirePermissions('maintenance.manage')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateMaintenanceRuleDto,
  ): Promise<unknown> {
    return this.maintenanceService.update(user, id, body);
  }

  @Delete(':id')
  @RequirePermissions('maintenance.manage')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.maintenanceService.remove(user, id);
  }
}
