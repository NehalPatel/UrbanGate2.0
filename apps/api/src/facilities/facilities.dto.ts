import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAmenityDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  /** Fee in rupees (converted to paise server-side). */
  @IsOptional()
  @IsString()
  feeRupees?: string;

  @IsOptional()
  @IsString()
  depositRupees?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  slotMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  advanceBookingDays?: number;
}

export class UpdateAmenityDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  feeRupees?: string;

  @IsOptional()
  @IsString()
  depositRupees?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  slotMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  advanceBookingDays?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateBookingDto {
  @IsString()
  amenityId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateHouseholdMemberDto {
  @IsString()
  unitId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  relation?: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}

export class UpdateHouseholdMemberDto {
  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  relation?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateServicePersonnelDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  mobile!: string;

  @IsString()
  @MinLength(2)
  serviceType!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unitIds?: string[];
}

export class UpdateServicePersonnelDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  serviceType?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unitIds?: string[];
}

export class LinkServiceUnitDto {
  @IsString()
  unitId!: string;
}
