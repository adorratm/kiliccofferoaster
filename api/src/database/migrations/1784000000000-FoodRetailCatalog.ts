import { MigrationInterface, QueryRunner } from 'typeorm';

export class FoodRetailCatalog1784000000000 implements MigrationInterface {
  name = 'FoodRetailCatalog1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "stock_movements_type_enum" ADD VALUE IF NOT EXISTS 'waste'`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" varchar(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "expires_at" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allergens" text[] NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ingredients" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "barcode" varchar(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "expires_at" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_entries" ADD COLUMN IF NOT EXISTS "category" varchar(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "stock" TYPE numeric(12,3) USING "stock"::numeric(12,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "stock" TYPE numeric(12,3) USING "stock"::numeric(12,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ALTER COLUMN "quantity" TYPE numeric(12,3) USING "quantity"::numeric(12,3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ALTER COLUMN "balance_after" TYPE numeric(12,3) USING "balance_after"::numeric(12,3)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ALTER COLUMN "balance_after" TYPE int USING ROUND("balance_after")::int`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ALTER COLUMN "quantity" TYPE int USING ROUND("quantity")::int`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "stock" TYPE int USING ROUND("stock")::int`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "stock" TYPE int USING ROUND("stock")::int`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_entries" DROP COLUMN IF EXISTS "category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "barcode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "ingredients"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "allergens"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "barcode"`,
    );
  }
}
