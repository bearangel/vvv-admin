import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../entities/user.entity'; // Assuming UserStatus enum is here

export class UserStatusDto {
  @IsEnum(UserStatus, {
    message: 'status must be one of: Active, Inactive',
  })
  @IsNotEmpty()
  status: UserStatus;
}
