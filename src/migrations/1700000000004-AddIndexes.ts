import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_articles_createdAt_id" 
      ON "articles" ("createdAt" DESC, "id" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_articles_authorId" 
      ON "articles" ("author_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_createdAt_id" 
      ON "users" ("createdAt" DESC, "id" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_permissionId" 
      ON "users" ("permission_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_articles_createdAt_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_articles_authorId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_createdAt_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_permissionId";`);
  }
}

