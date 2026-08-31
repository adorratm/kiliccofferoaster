import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountingPaytrCommission1796000000000
  implements MigrationInterface
{
  name = 'AccountingPaytrCommission1796000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounting_settings"
      ADD COLUMN IF NOT EXISTS "paytr_commission_rate_percent" numeric(5,2) NOT NULL DEFAULT 2.19
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounting_settings"
      DROP COLUMN IF EXISTS "paytr_commission_rate_percent"
    `);
  }
}
