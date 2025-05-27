import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Base DTO for fields that are updatable
class RoleUpdateBaseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoleDto extends PartialType(RoleUpdateBaseDto) {
  // tenantId and type are generally not updatable once a role is created.
  // Status is updated via a separate DTO and endpoint.
}
