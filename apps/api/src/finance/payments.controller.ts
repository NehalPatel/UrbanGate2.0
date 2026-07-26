import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { PaymentMode } from '@urbangate/database';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../common/require-permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { PaymentsService } from './invoices-payments.service';
import { RecordPaymentDto } from './payments.dto';

@Controller('payments')
@UseGuards(AuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payment.view')
  list(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.paymentsService.list(user);
  }

  @Post()
  @RequirePermissions('payment.record')
  record(@CurrentUser() user: AuthUser, @Body() body: RecordPaymentDto): Promise<unknown> {
    return this.paymentsService.record(user, {
      ...body,
      mode: body.mode as PaymentMode,
    });
  }

  @Get(':id/receipt')
  @RequirePermissions('payment.view')
  receipt(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.paymentsService.getReceipt(user, id);
  }

  @Post(':id/reverse')
  @RequirePermissions('payment.reverse')
  reverse(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.paymentsService.reverse(user, id);
  }
}
