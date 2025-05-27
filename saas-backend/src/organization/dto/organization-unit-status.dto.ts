import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrganizationUnitStatus } from '../entities/organization-unit.entity';

export class OrganizationUnitStatusDto {
  @IsEnum(OrganizationUnitStatus, {
    message: 'status must be one of: Active, Inactive',
  })
  @IsNotEmpty()
  status: OrganizationUnitStatus;
}
