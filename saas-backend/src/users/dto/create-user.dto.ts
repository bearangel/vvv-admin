import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  MinLength,
  Matches,
  IsArray,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. It must contain at least one uppercase letter, one lowercase letter, and one number or special character.',
  })
  password: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

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
