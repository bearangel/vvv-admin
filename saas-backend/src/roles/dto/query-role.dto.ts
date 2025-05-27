import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleStatus, RoleType } from '../entities/role.entity';

export class QueryRoleDto {
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
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RoleType, { message: 'type must be either System or TenantCustom' })
  type?: RoleType;

  @IsOptional()
  @IsEnum(RoleStatus, { message: 'status must be one of: Active, Inactive' })
  status?: RoleStatus;
}
