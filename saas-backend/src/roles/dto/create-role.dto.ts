import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { RoleType } from '../entities/role.entity';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf(o => o.type === RoleType.TENANT_CUSTOM) // tenantId is required if type is TenantCustom
  @IsNotEmpty({ message: 'tenantId is required for TenantCustom roles' })
  @IsUUID()
  tenantId?: string; // Will be set to null if type is System

  @IsEnum(RoleType, { message: 'type must be either System or TenantCustom' })
  @IsNotEmpty()
  type: RoleType;
}
