import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { GateService } from './gate.service';
import {
  CreateEmergencyContactDto,
  CreateGateDto,
  CreateVehicleDto,
  CreateVisitorDto,
  UpdateEmergencyContactDto,
  UpdateGateDto,
  UpdateVehicleDto,
} from './gate.dto';

@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class GateController {
  constructor(private readonly gate: GateService) {}

  @Get('gates')
  @RequirePermissions('gate.view')
  listGates(@CurrentUser() user: AuthUser) {
    return this.gate.listGates(user);
  }

  @Post('gates')
  @RequirePermissions('gate.manage')
  createGate(@CurrentUser() user: AuthUser, @Body() body: CreateGateDto) {
    return this.gate.createGate(user, body);
  }

  @Patch('gates/:id')
  @RequirePermissions('gate.manage')
  updateGate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateGateDto,
  ) {
    return this.gate.updateGate(user, id, body);
  }

  @Delete('gates/:id')
  @RequirePermissions('gate.manage')
  removeGate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gate.removeGate(user, id);
  }

  @Get('visitors')
  @RequirePermissions('visitor.view')
  listVisitors(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.gate.listVisitors(user, status);
  }

  @Post('visitors')
  @RequirePermissions('visitor.create')
  createVisitor(@CurrentUser() user: AuthUser, @Body() body: CreateVisitorDto) {
    return this.gate.createVisitor(user, body);
  }

  @Post('visitors/:id/approve')
  @RequirePermissions('visitor.approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gate.approveVisitor(user, id);
  }

  @Post('visitors/:id/reject')
  @RequirePermissions('visitor.approve')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gate.rejectVisitor(user, id);
  }

  @Post('visitors/:id/check-in')
  @RequirePermissions('visitor.checkin')
  checkIn(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gate.checkIn(user, id);
  }

  @Post('visitors/:id/check-out')
  @RequirePermissions('visitor.checkout')
  checkOut(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gate.checkOut(user, id);
  }

  @Get('emergency-contacts')
  @RequirePermissions('emergency.view')
  listEmergency(@CurrentUser() user: AuthUser) {
    return this.gate.listEmergency(user);
  }

  @Post('emergency-contacts')
  @RequirePermissions('emergency.manage')
  createEmergency(@CurrentUser() user: AuthUser, @Body() body: CreateEmergencyContactDto) {
    return this.gate.createEmergency(user, body);
  }

  @Patch('emergency-contacts/:id')
  @RequirePermissions('emergency.manage')
  updateEmergency(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateEmergencyContactDto,
  ) {
    return this.gate.updateEmergency(user, id, body);
  }

  @Delete('emergency-contacts/:id')
  @RequirePermissions('emergency.manage')
  removeEmergency(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gate.removeEmergency(user, id);
  }

  @Get('vehicles')
  @RequirePermissions('vehicle.view')
  listVehicles(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.gate.listVehicles(user, q);
  }

  @Post('vehicles')
  @RequirePermissions('vehicle.manage')
  createVehicle(@CurrentUser() user: AuthUser, @Body() body: CreateVehicleDto) {
    return this.gate.createVehicle(user, body);
  }

  @Patch('vehicles/:id')
  @RequirePermissions('vehicle.manage')
  updateVehicle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateVehicleDto,
  ) {
    return this.gate.updateVehicle(user, id, body);
  }

  @Delete('vehicles/:id')
  @RequirePermissions('vehicle.manage')
  removeVehicle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.gate.removeVehicle(user, id);
  }

  @Get('lookups/members')
  @RequirePermissions('member.view')
  lookupMembers(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.gate.lookupMembers(user, q);
  }

  @Get('lookups/units')
  @RequirePermissions('unit.view')
  lookupUnits(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.gate.lookupUnits(user, q);
  }
}
