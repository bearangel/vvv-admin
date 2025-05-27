import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer'; // For type conversion
import { TenantStatus } from '../entities/tenant.entity'; // Assuming TenantStatus enum is here

export class QueryTenantDto {
  @IsOptional()
  @Type(() => Number) // Ensure query param string is converted to number
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number) // Ensure query param string is converted to number
  @IsInt()
  @Min(1)
  @Max(100) // Example max page size
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TenantStatus, { message: 'status must be one of: Active, Inactive' })
  status?: TenantStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
