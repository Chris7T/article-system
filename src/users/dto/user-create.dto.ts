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
import { ApiProperty } from '@nestjs/swagger';
import { PermissionType } from '../../common/enums/permission-type.enum';

export class UserCreateDto {
  @ApiProperty({ example: 'John Doe', minLength: 3, maxLength: 100 })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must have at least 3 characters' })
  @MaxLength(100, { message: 'Name must have at most 100 characters' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  password: string;

  @ApiProperty({ example: 1, enum: PermissionType, description: '1 = READER, 2 = EDITOR, 3 = ADMIN' })
  @IsNotEmpty({ message: 'Permission ID is required' })
  @IsInt({ message: 'Permission ID must be an integer' })
  @IsEnum(PermissionType, {
    message: 'Permission ID must be 1 (READER), 2 (EDITOR) or 3 (ADMIN)',
  })
  permission_id: PermissionType;
}
