import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class AssignPermissionsToRoleDto {
  @IsArray()
  @IsUUID('all', { each: true, message: 'Each permissionId must be a valid UUID' })
  @IsNotEmpty({ message: 'permissionIds array cannot be empty if provided, or should contain valid UUIDs.' }) // Consider allowing empty array to remove all permissions
  permissionIds: string[];
}
