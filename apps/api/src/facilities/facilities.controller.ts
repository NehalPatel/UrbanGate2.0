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
import { FacilitiesService } from './facilities.service';
import {
  CreateAmenityDto,
  CreateBookingDto,
  CreateHouseholdMemberDto,
  CreateServicePersonnelDto,
  LinkServiceUnitDto,
  UpdateAmenityDto,
  UpdateHouseholdMemberDto,
  UpdateServicePersonnelDto,
} from './facilities.dto';

@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class FacilitiesController {
  constructor(private readonly facilities: FacilitiesService) {}

  @Get('amenities')
  @RequirePermissions('amenity.view')
  listAmenities(@CurrentUser() user: AuthUser) {
    return this.facilities.listAmenities(user);
  }

  @Post('amenities')
  @RequirePermissions('amenity.manage')
  createAmenity(@CurrentUser() user: AuthUser, @Body() body: CreateAmenityDto) {
    return this.facilities.createAmenity(user, body);
  }

  @Patch('amenities/:id')
  @RequirePermissions('amenity.manage')
  updateAmenity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateAmenityDto,
  ) {
    return this.facilities.updateAmenity(user, id, body);
  }

  @Delete('amenities/:id')
  @RequirePermissions('amenity.manage')
  removeAmenity(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.removeAmenity(user, id);
  }

  @Get('bookings')
  @RequirePermissions('booking.view')
  listBookings(@CurrentUser() user: AuthUser) {
    return this.facilities.listBookings(user);
  }

  @Post('bookings')
  @RequirePermissions('booking.create')
  createBooking(@CurrentUser() user: AuthUser, @Body() body: CreateBookingDto) {
    return this.facilities.createBooking(user, body);
  }

  @Post('bookings/:id/cancel')
  @RequirePermissions('booking.create')
  cancelBooking(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.cancelBooking(user, id);
  }

  @Post('bookings/:id/complete')
  @RequirePermissions('booking.manage')
  completeBooking(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.completeBooking(user, id);
  }

  @Get('household-members')
  @RequirePermissions('household.view')
  listHousehold(@CurrentUser() user: AuthUser, @Query('unitId') unitId?: string) {
    return this.facilities.listHousehold(user, unitId);
  }

  @Post('household-members')
  @RequirePermissions('household.manage')
  createHousehold(@CurrentUser() user: AuthUser, @Body() body: CreateHouseholdMemberDto) {
    return this.facilities.createHouseholdMember(user, body);
  }

  @Patch('household-members/:id')
  @RequirePermissions('household.manage')
  updateHousehold(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateHouseholdMemberDto,
  ) {
    return this.facilities.updateHouseholdMember(user, id, body);
  }

  @Delete('household-members/:id')
  @RequirePermissions('household.manage')
  removeHousehold(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.removeHouseholdMember(user, id);
  }

  @Get('service-personnel')
  @RequirePermissions('service.view')
  listService(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.facilities.listServicePersonnel(user, q);
  }

  @Post('service-personnel')
  @RequirePermissions('service.manage')
  createService(@CurrentUser() user: AuthUser, @Body() body: CreateServicePersonnelDto) {
    return this.facilities.createServicePersonnel(user, body);
  }

  @Patch('service-personnel/:id')
  @RequirePermissions('service.manage')
  updateService(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateServicePersonnelDto,
  ) {
    return this.facilities.updateServicePersonnel(user, id, body);
  }

  @Delete('service-personnel/:id')
  @RequirePermissions('service.manage')
  removeService(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.removeServicePersonnel(user, id);
  }

  @Post('service-personnel/:id/units')
  @RequirePermissions('service.manage')
  linkUnit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: LinkServiceUnitDto,
  ) {
    return this.facilities.linkServiceUnit(user, id, body.unitId);
  }
}
