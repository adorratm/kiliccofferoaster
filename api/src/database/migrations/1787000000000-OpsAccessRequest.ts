import { MigrationInterface, QueryRunner } from 'typeorm';

export class OpsAccessRequest1787000000000 implements MigrationInterface {
  name = 'OpsAccessRequest1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "ops_access_requested_at" TIMESTAMPTZ NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "ops_access_requested_at"
    `);
  }
}
