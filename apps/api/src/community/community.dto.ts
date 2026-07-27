import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(2)
  body!: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  body?: string;

  @IsOptional()
  @IsString()
  audience?: string;
}

export enum ComplaintPriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ComplaintStatusDto {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export class CreateComplaintDto {
  @IsString()
  @MinLength(2)
  category!: string;

  @IsString()
  @MinLength(2)
  subject!: string;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsOptional()
  @IsEnum(ComplaintPriorityDto)
  priority?: ComplaintPriorityDto;

  @IsOptional()
  @IsString()
  unitId?: string;
}

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatusDto)
  status!: ComplaintStatusDto;

  @IsOptional()
  @IsString()
  assignedToUserId?: string;
}

export enum MeetingStatusDto {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateMeetingDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(2)
  agenda!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  onlineLink?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsBoolean()
  schedule?: boolean;
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  agenda?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  onlineLink?: string;

  @IsOptional()
  @IsString()
  audience?: string;
}

export class CompleteMeetingDto {
  @IsOptional()
  @IsString()
  minutes?: string;
}
