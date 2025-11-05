import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { PermissionType } from '../../common/enums/permission-type.enum';

export class UserCreateDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must have at least 3 characters' })
  @MaxLength(100, { message: 'Name must have at most 100 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  password: string;

  @IsNotEmpty({ message: 'Permission ID is required' })
  @IsInt({ message: 'Permission ID must be an integer' })
  @IsEnum(PermissionType, {
    message: 'Permission ID must be 1 (READER), 2 (EDITOR) or 3 (ADMIN)',
  })
  permission_id: PermissionType;
}
