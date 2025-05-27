import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUrl,
  IsEnum,
  IsNumber,
  Matches,
} from 'class-validator';
import { TenantType } from '../entities/tenant.entity'; // Import the source enum

// Placeholder for a custom @Unique decorator - actual implementation would require DB lookup
// For now, we'll rely on service-level checks.
// import { Unique } from '../validators/unique.validator'; // Assuming a custom validator path

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  // @Unique('tenant', 'name') // Placeholder for actual unique validation
  name: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'contactPhone must be a valid E.164 phone number (e.g., +12125552368)',
  })
  contactPhone?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsEnum(TenantType, { message: 'tenantType must be one of: FreeTrial, Standard, Enterprise' })
  @IsNotEmpty()
  tenantType: TenantType; // Use the imported enum

  @IsOptional()
  @IsNumber()
  subscriptionPlanId?: number;
}
