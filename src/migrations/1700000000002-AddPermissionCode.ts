import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPermissionCode1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'permissions',
      new TableColumn({
        name: 'code',
        type: 'integer',
        isUnique: true,
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE permissions SET code = 1 WHERE name = 'reader';
      UPDATE permissions SET code = 2 WHERE name = 'editor';
      UPDATE permissions SET code = 3 WHERE name = 'admin';
    `);

    await queryRunner.query(`
      ALTER TABLE permissions ALTER COLUMN code SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('permissions', 'code');
  }
}

