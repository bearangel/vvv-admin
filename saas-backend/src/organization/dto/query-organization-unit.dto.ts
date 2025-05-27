import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsUUID,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrganizationUnitStatus } from '../entities/organization-unit.entity';

export class QueryOrganizationUnitDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Example max page size
  pageSize?: number = 10;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsOptional()
  @IsString()
  name?: string; // Fuzzy search on name

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level?: number; // Filter by hierarchy level

  @IsOptional()
  @IsUUID()
  parentId?: string; // Filter by direct parent (use 'null' as string for root items)

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true) // Handle string 'true' or boolean true
  @IsBoolean()
  includeChildren?: boolean = false;

  @IsOptional()
  @IsEnum(OrganizationUnitStatus, { message: 'status must be one of: Active, Inactive' })
  status?: OrganizationUnitStatus;
}
