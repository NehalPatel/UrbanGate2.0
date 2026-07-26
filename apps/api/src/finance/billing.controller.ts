import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { BillingService } from './billing.service';
import { CreateBillingRunDto } from './billing.dto';

@Controller('billing-runs')
@UseGuards(AuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermissions('invoice.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.billingService.listRuns(user);
  }

  @Post()
  @RequirePermissions('invoice.create')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateBillingRunDto): Promise<unknown> {
    return this.billingService.runBilling(user, body);
  }
}
