import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '../entities/user.entity';

export class QueryUserDto {
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
  @IsNotEmpty() // tenantId is mandatory for data scoping
  tenantId: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'status must be one of: Active, Inactive' })
  status?: UserStatus;

  @IsOptional()
  @IsUUID()
  organizationUnitId?: string;
}
