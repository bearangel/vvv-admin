import { IsEnum, IsNotEmpty } from 'class-validator';
import { TenantStatus } from '../entities/tenant.entity'; // Import the source enum

export class TenantStatusDto {
  @IsEnum(TenantStatus, {
    message: 'status must be one of: Active, Inactive',
  })
  @IsNotEmpty()
  status: TenantStatus; // Use the imported enum
}
