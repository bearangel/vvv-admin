import { IsString, IsOptional, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Base DTO for fields that are updatable
class OrganizationUnitUpdateBaseDto {
  @IsString()
  @IsOptional() // Name is not always required for update, only if changing
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null; // Allow setting to null for moving to root

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  leaderUserId?: string | null; // Allow unsetting leader
}

export class UpdateOrganizationUnitDto extends PartialType(OrganizationUnitUpdateBaseDto) {
  // tenantId is not updatable.
  // Status is updated via a separate DTO and endpoint.
}
