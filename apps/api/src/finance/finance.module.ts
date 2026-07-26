import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { SocietiesModule } from '../societies/societies.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { InvoicesController } from './invoices.controller';
import { PaymentsController } from './payments.controller';
import { InvoicesService, PaymentsService } from './invoices-payments.service';

@Module({
  imports: [AuthModule, AuditModule, SocietiesModule],
  controllers: [
    MaintenanceController,
    BillingController,
    InvoicesController,
    PaymentsController,
  ],
  providers: [MaintenanceService, BillingService, InvoicesService, PaymentsService],
})
export class FinanceModule {}
