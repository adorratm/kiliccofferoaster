import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Satış fişi ↔ fatura: invoices.okc_sale_id (ÖKC kaynaklı iç fiş bağı).
 */
export class InvoiceOkcSaleAndReceipt1794000000000
  implements MigrationInterface
{
  name = 'InvoiceOkcSaleAndReceipt1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD COLUMN IF NOT EXISTS "okc_sale_id" uuid
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "invoices"
        ADD CONSTRAINT "FK_invoices_okc_sale_id"
        FOREIGN KEY ("okc_sale_id") REFERENCES "okc_sales"("id")
        ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoices_okc_sale_id_unique"
      ON "invoices" ("okc_sale_id")
      WHERE "okc_sale_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_invoices_okc_sale_id_unique"`,
    );
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_okc_sale_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices" DROP COLUMN IF EXISTS "okc_sale_id"
    `);
  }
}
