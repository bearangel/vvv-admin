import { IsEnum, IsNotEmpty } from 'class-validator';
import { PermissionStatus } from '../entities/permission.entity';

export class PermissionStatusDto {
  @IsEnum(PermissionStatus, {
    message: 'status must be one of: Active, Inactive',
  })
  @IsNotEmpty()
  status: PermissionStatus;
}
