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

describe('ArticlesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let editorToken: string;
  let readerToken: string;
  let adminUserId: string;
  let editorUserId: string;

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
    const users = await seedDatabase(dataSource);
    adminUserId = users.adminUser.id;
    editorUserId = users.editorUser.id;
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

    return { adminUser, editorUser, readerUser };
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

  describe('/articles (GET)', () => {
    it('should list all articles with pagination (authenticated users)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/articles')
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('hasMore');
      expect(typeof response.body.meta.hasMore).toBe('boolean');
      if (response.body.meta.hasMore) {
        expect(response.body.meta).toHaveProperty('cursor');
      }
    });

    it('should support cursor pagination', async () => {
      for (let i = 0; i < 15; i++) {
        await request(app.getHttpServer())
          .post('/api/articles')
          .set('Authorization', `Bearer ${editorToken}`)
          .send({
            title: `Test Article ${i}`,
            content: `Content ${i}`,
          });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const firstPage = await request(app.getHttpServer())
        .get('/api/articles')
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(200);

      expect(firstPage.body.data.length).toBeLessThanOrEqual(10);
      expect(firstPage.body.meta).toHaveProperty('hasMore');

      if (firstPage.body.meta.hasMore) {
        expect(firstPage.body.meta.cursor).toBeDefined();
        const cursorId = firstPage.body.meta.cursor;
        const lastItemFirstPage = firstPage.body.data[firstPage.body.data.length - 1];
        
        expect(lastItemFirstPage.id).toBe(cursorId);
        
        const secondPage = await request(app.getHttpServer())
          .get(`/api/articles?cursor=${cursorId}`)
          .set('Authorization', `Bearer ${readerToken}`)
          .expect(200);

        expect(secondPage.body.data.length).toBeGreaterThan(0);
        expect(secondPage.body.data.length).toBeLessThanOrEqual(10);
        expect(secondPage.body.meta).toHaveProperty('hasMore');
        expect(secondPage.body.meta).toHaveProperty('cursor');
        
        expect(secondPage.body.data).toBeInstanceOf(Array);
        expect(secondPage.body.data.length).toBeGreaterThan(0);
      }
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/articles')
        .expect(401);
    });
  });

  describe('/articles (POST)', () => {
    it('should create article (editor and admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article content',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Article');
      expect(response.body.author_id).toBe(editorUserId);
    });

    it('should not allow reader to create articles', () => {
      return request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article content',
        })
        .expect(403);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Test Article',
        })
        .expect(400);
    });
  });

  describe('/articles/:id (GET)', () => {
    let articleId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Get Article Test',
          content: 'Content for get test',
        });
      articleId = response.body.id;
    });

    it('should get article by id (authenticated users)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(200);

      expect(response.body.id).toBe(articleId);
      expect(response.body.title).toBe('Get Article Test');
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/articles/${articleId}`)
        .expect(401);
    });

    it('should return 404 for non-existent article', () => {
      return request(app.getHttpServer())
        .get('/api/articles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(404);
    });
  });

  describe('/articles/:id (PATCH)', () => {
    let articleId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Update Article Test',
          content: 'Content for update test',
        });
      articleId = response.body.id;
    });

    it('should update article (editor and admin)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Updated Article Title',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Article Title');
    });

    it('should not allow reader to update articles', () => {
      return request(app.getHttpServer())
        .patch(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(403);
    });
  });

  describe('/articles/:id (DELETE)', () => {
    let articleId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/articles')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Delete Article Test',
          content: 'Content for delete test',
        });
      articleId = response.body.id;
    });

    it('should soft delete article (editor and admin)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(404);
    });

    it('should not allow reader to delete articles', () => {
      return request(app.getHttpServer())
        .delete(`/api/articles/${articleId}`)
        .set('Authorization', `Bearer ${readerToken}`)
        .expect(403);
    });
  });
});

