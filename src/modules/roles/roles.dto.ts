import { MfaMethod } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsLocale,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MinLength,
  IsNotEmpty
} from 'class-validator';

export class RoleDto {
  
  @IsNotEmpty()
  name !: string;
}


export class RevokeGroupRoleDto {
  
  @IsNotEmpty()
  name !: string;
}

export class UpdateRoleDto {

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  scopes?: string[];

}
