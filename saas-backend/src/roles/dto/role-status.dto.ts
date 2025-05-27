import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoleStatus } from '../entities/role.entity';

export class RoleStatusDto {
  @IsEnum(RoleStatus, {
    message: 'status must be one of: Active, Inactive',
  })
  @IsNotEmpty()
  status: RoleStatus;
}
