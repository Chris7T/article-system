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

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

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

    const readerUser = userRepo.create({
      name: 'Reader User',
      email: 'reader@test.com',
      password: hashedPassword,
      permission: readerPermission,
    });
    await userRepo.save(readerUser);
  }

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@test.com');
          expect(res.body.user.permission_id).toBe(PermissionType.READER);
        });
    });

    it('should not register user with existing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'test@test.com',
          password: 'password123',
        })
        .expect(409);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      adminToken = response.body.access_token;
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should not login with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'reader@test.com',
          password: 'password123',
        });

      const token = loginResponse.body.access_token;

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Logged out successfully');
        });
    });

    it('should invalidate token after logout', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      const token = loginResponse.body.access_token;

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/articles')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });
  });
});

