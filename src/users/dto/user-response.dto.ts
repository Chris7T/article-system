import { Expose, Transform } from 'class-transformer';
import { PermissionType } from '../../common/enums/permission-type.enum';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.permission && typeof obj.permission === 'object') {
      return obj.permission.code || PermissionType.READER;
    }
    return PermissionType.READER;
  })
  permission_id: PermissionType;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.permission && typeof obj.permission === 'object') {
      return obj.permission.name || 'reader';
    }
    return 'reader';
  })
  permission_name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
