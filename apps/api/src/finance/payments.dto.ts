import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum PaymentModeDto {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  MANUAL_ONLINE = 'MANUAL_ONLINE',
}

export class RecordPaymentDto {
  @IsString()
  invoiceId!: string;

  @IsString()
  @MinLength(1)
  amount!: string;

  @IsEnum(PaymentModeDto)
  mode!: PaymentModeDto;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
