import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { hasPermission } from '@urbangate/permissions';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { SocietiesService } from './societies.service';
import { CreateSocietyDto, UpdateSocietyDto } from './societies.dto';

@Controller('societies')
@UseGuards(AuthGuard, PermissionsGuard)
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.societiesService.listForUser(user);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateSocietyDto) {
    return this.societiesService.create(user, body);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    this.assertCan(user, id, 'society.view');
    return this.societiesService.get(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: UpdateSocietyDto) {
    this.assertCan(user, id, 'society.update');
    return this.societiesService.update(user, id, body);
  }

  private assertCan(user: AuthUser, societyId: string, permission: 'society.view' | 'society.update') {
    if (user.isPlatformAdmin) return;
    const membership = user.memberships.find((m) => m.societyId === societyId);
    if (!membership || !hasPermission(membership.roleKeys, permission)) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions for this society',
      });
    }
  }
}
