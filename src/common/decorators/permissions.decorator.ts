import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../enums/permission-type.enum';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
