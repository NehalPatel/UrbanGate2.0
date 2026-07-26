import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMaintenanceRuleDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  amount!: string;

  @IsOptional()
  @IsString()
  frequency?: string;
}

export class UpdateMaintenanceRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
