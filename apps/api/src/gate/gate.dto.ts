import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class UpdateGateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateVisitorDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  mobile!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  gateId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** When true, walk-in is created as APPROVED (security desk). */
  @IsOptional()
  @IsBoolean()
  preApproved?: boolean;

  /** When true, create and check in immediately. */
  @IsOptional()
  @IsBoolean()
  checkInNow?: boolean;
}

export class CreateEmergencyContactDto {
  @IsString()
  @MinLength(2)
  label!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateEmergencyContactDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  phone?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateVehicleDto {
  @IsString()
  @MinLength(4)
  registrationNumber!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  makeModel?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  unitId?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  makeModel?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
