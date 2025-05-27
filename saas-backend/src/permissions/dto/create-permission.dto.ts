import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { PermissionOperationType } from '../entities/permission.entity';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  resourceIdentifier: string;

  @IsOptional()
  @IsEnum(PermissionOperationType, {
    message: 'operationType must be a valid PermissionOperationType',
  })
  operationType?: PermissionOperationType;
}
