import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum UnitRelationshipTypeDto {
  OWNER = 'OWNER',
  CO_OWNER = 'CO_OWNER',
  TENANT = 'TENANT',
  RESIDENT = 'RESIDENT',
  FAMILY_MEMBER = 'FAMILY_MEMBER',
}

export class CreateUnitDto {
  @IsString()
  buildingId!: string;

  @IsString()
  @MinLength(1)
  number!: string;

  @IsOptional()
  @IsString()
  floor?: string;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  number?: string;

  @IsOptional()
  @IsString()
  floor?: string;
}

export class AssignUnitRelationshipDto {
  @IsString()
  unitId!: string;

  @IsString()
  userId!: string;

  @IsEnum(UnitRelationshipTypeDto)
  type!: UnitRelationshipTypeDto;
}
