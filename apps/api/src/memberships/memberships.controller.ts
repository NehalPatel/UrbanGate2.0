import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { MembershipsService } from './memberships.service';
import { InviteMemberDto } from './memberships.dto';

@Controller('memberships')
@UseGuards(AuthGuard, PermissionsGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @RequirePermissions('member.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.membershipsService.list(user);
  }

  @Post('invite')
  @RequirePermissions('member.invite')
  invite(@CurrentUser() user: AuthUser, @Body() body: InviteMemberDto): Promise<unknown> {
    return this.membershipsService.invite(user, body);
  }
}
