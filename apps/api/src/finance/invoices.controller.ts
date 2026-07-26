import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { InvoicesService } from './invoices-payments.service';

@Controller('invoices')
@UseGuards(AuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions('invoice.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.invoicesService.list(user);
  }

  @Get('reports/collection')
  @RequirePermissions('invoice.view')
  collection(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.invoicesService.collectionReport(user);
  }

  @Get(':id')
  @RequirePermissions('invoice.view')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.invoicesService.get(user, id);
  }
}
