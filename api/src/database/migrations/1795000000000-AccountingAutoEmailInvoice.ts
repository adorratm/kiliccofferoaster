import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountingAutoEmailInvoice1795000000000
  implements MigrationInterface
{
  name = 'AccountingAutoEmailInvoice1795000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounting_settings"
      ADD COLUMN IF NOT EXISTS "auto_email_invoice_on_gib" boolean NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounting_settings"
      DROP COLUMN IF EXISTS "auto_email_invoice_on_gib"
    `);
  }
}
