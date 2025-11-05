import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/entities/user.entity';
import { Permission } from '../src/entities/permission.entity';
import { Article } from '../src/entities/article.entity';
import { TokenBlacklist } from '../src/entities/token-blacklist.entity';
import { PermissionType } from '../src/common/enums/permission-type.enum';
import * as bcrypt from 'bcrypt';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [User, Permission, Article, TokenBlacklist],
        synchronize: true,
        dropSchema: true,
      }),
      AppModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  await app.init();
  await seedTestDatabase(app);
  return app;
}

async function seedTestDatabase(app: INestApplication) {
  const dataSource = app.get(DataSource);
  const permissionRepo = dataSource.getRepository(Permission);
  const userRepo = dataSource.getRepository(User);

  const readerPermission = permissionRepo.create({
    name: 'Reader',
    description: 'Can read articles',
    code: PermissionType.READER,
  });
  await permissionRepo.save(readerPermission);

  const editorPermission = permissionRepo.create({
    name: 'Editor',
    description: 'Can read, create, edit and delete articles',
    code: PermissionType.EDITOR,
  });
  await permissionRepo.save(editorPermission);

  const adminPermission = permissionRepo.create({
    name: 'Admin',
    description: 'Can manage articles and users',
    code: PermissionType.ADMIN,
  });
  await permissionRepo.save(adminPermission);

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminUser = userRepo.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: hashedPassword,
    permission: adminPermission,
  });
  await userRepo.save(adminUser);

  const editorUser = userRepo.create({
    name: 'Editor User',
    email: 'editor@test.com',
    password: hashedPassword,
    permission: editorPermission,
  });
  await userRepo.save(editorUser);

  const readerUser = userRepo.create({
    name: 'Reader User',
    email: 'reader@test.com',
    password: hashedPassword,
    permission: readerPermission,
  });
  await userRepo.save(readerUser);
}
