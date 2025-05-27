import {
  IsString,
  IsOptional,
  IsUUID,
  Matches,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Define a base DTO with fields that can be updated in the user_profiles table
class UserProfileUpdateBaseDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be a valid E.164 phone number (e.g., +12125552368)',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true, message: 'Each roleId must be a valid UUID' })
  roleIds?: string[];

  @IsOptional()
  @IsUUID()
  organizationUnitId?: string;
}

export class UpdateUserDto extends PartialType(UserProfileUpdateBaseDto) {}
