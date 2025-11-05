import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ArticlesModule } from '../src/articles/articles.module';
import { User } from '../src/entities/user.entity';
import { Permission } from '../src/entities/permission.entity';
import { Article } from '../src/entities/article.entity';
import { TokenBlacklist } from '../src/entities/token-blacklist.entity';
import { PermissionType } from '../src/common/enums/permission-type.enum';
import * as bcrypt from 'bcrypt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let editorToken: string;
  let readerToken: string;

  beforeAll(async () => {
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
        AuthModule,
        UsersModule,
        ArticlesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new (await import('@nestjs/common')).ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await seedDatabase(dataSource);
    await app.init();

    const tokens = await loginUsers();
    adminToken = tokens.adminToken;
    editorToken = tokens.editorToken;
    readerToken = tokens.readerToken;
  });

  async function seedDatabase(dataSource: DataSource) {
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

  async function loginUsers() {
    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    const editorResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'editor@test.com', password: 'password123' });

    const readerResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'reader@test.com', password: 'password123' });

    return {
      adminToken: adminResponse.body.access_token,
      editorToken: editorResponse.body.access_token,
      readerToken: readerResponse.body.access_token,
    };
  }

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should list all users (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should not allow non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(403);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(401);
    });
  });

  describe('/users (POST)', () => {
    it('should create user (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'password123',
          permission_id: PermissionType.READER,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('newuser@test.com');
      expect(response.body.permission_id).toBe(PermissionType.READER);
    });

    it('should not allow non-admin users', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'New User',
          email: 'newuser2@test.com',
          password: 'password123',
          permission_id: PermissionType.READER,
        })
        .expect(403);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
        })
        .expect(400);
    });
  });

  describe('/users/:id (GET)', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'testuser@test.com',
          password: 'password123',
          permission_id: PermissionType.READER,
        });
      userId = response.body.id;
    });

    it('should get user by id (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('testuser@test.com');
    });

    it('should not allow non-admin users', () => {
      return request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Update User',
          email: 'updateuser@test.com',
          password: 'password123',
          permission_id: PermissionType.READER,
        });
      userId = response.body.id;
    });

    it('should update user (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated User',
          permission_id: PermissionType.EDITOR,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated User');
      expect(response.body.permission_id).toBe(PermissionType.EDITOR);
    });

    it('should not allow non-admin users', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          name: 'Updated User',
        })
        .expect(403);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Delete User',
          email: 'deleteuser@test.com',
          password: 'password123',
          permission_id: PermissionType.READER,
        });
      userId = response.body.id;
    });

    it('should soft delete user (admin only)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should not allow non-admin users', () => {
      return request(app.getHttpServer())
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);
    });
  });
});

