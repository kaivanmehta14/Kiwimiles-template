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

export class ScopeDto {
  
  @IsNotEmpty()
  name !: string;
}

