import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionStatus } from '../entities/permission.entity';

export class QueryPermissionDto {
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

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  resourceIdentifier?: string;

  @IsOptional()
  @IsEnum(PermissionStatus, { message: 'status must be one of: Active, Inactive' })
  status?: PermissionStatus;
}
