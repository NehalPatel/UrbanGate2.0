import { ArrayNotEmpty, IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleKeys!: string[];

  /** Optional override; otherwise API generates a one-time password for new accounts. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  temporaryPassword?: string;
}
