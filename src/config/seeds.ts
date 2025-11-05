import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from '../entities/permission.entity';
import { User } from '../entities/user.entity';
import { PermissionType } from '../common/enums/permission-type.enum';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'article_system',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

async function runSeeds() {
  try {
    await dataSource.initialize();

    const permissionRepository = dataSource.getRepository(Permission);
    const userRepository = dataSource.getRepository(User);

    const adminPermission = permissionRepository.create({
      code: PermissionType.ADMIN,
      name: 'admin',
      description:
        'Permission to manage articles and users. Actions: Read, Create, Edit and Delete articles and users.',
    });

    const editorPermission = permissionRepository.create({
      code: PermissionType.EDITOR,
      name: 'editor',
      description:
        'Permission to manage articles. Actions: Read, Create, Edit and Delete articles.',
    });

    const readerPermission = permissionRepository.create({
      code: PermissionType.READER,
      name: 'reader',
      description: 'Permission to only read articles. Actions: Read articles.',
    });

    const existingPermissions = await permissionRepository.find();
    if (existingPermissions.length === 0) {
      await permissionRepository.save([
        adminPermission,
        editorPermission,
        readerPermission,
      ]);
    }

    const existingRoot = await userRepository.findOne({
      where: { email: 'root@admin.com' },
      relations: ['permission'],
    });

    if (!existingRoot) {
      const hashedPassword = await bcrypt.hash('root123', 10);
      
      const adminPermission = await permissionRepository.findOne({
        where: { code: PermissionType.ADMIN },
      });

      const rootUser = userRepository.create({
        name: 'Root Admin',
        email: 'root@admin.com',
        password: hashedPassword,
        permission: adminPermission,
      });

      await userRepository.save(rootUser);
    }

    await dataSource.destroy();
  } catch (error) {
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeeds();

