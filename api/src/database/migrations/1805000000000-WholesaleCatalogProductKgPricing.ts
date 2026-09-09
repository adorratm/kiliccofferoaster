import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Toptan fiyat: varyant/gramaj → ürün bazlı ₺/kg (min. 10 kg).
 * Menşei + tadım notası alanları eklenir. Eski varyant fiyatları temizlenir.
 */
export class WholesaleCatalogProductKgPricing1805000000000
  implements MigrationInterface
{
  name = 'WholesaleCatalogProductKgPricing1805000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "wholesale_catalog_prices"`);

    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        DROP CONSTRAINT IF EXISTS "FK_wholesale_catalog_prices_variant"
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        DROP CONSTRAINT IF EXISTS "UQ_wholesale_catalog_prices_catalog_variant"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_wholesale_catalog_prices_variant_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        DROP COLUMN IF EXISTS "variant_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD COLUMN IF NOT EXISTS "product_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD COLUMN IF NOT EXISTS "origin_country" varchar(80)
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD COLUMN IF NOT EXISTS "origin_region" varchar(120)
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD COLUMN IF NOT EXISTS "flavor_notes" text[]
    `);

    // product_id zorunlu (tablo boş)
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ALTER COLUMN "product_id" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_wholesale_catalog_prices_catalog_product"
      ON "wholesale_catalog_prices" ("catalog_id", "product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_wholesale_catalog_prices_product_id"
      ON "wholesale_catalog_prices" ("product_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        DROP CONSTRAINT IF EXISTS "FK_wholesale_catalog_prices_product"
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD CONSTRAINT "FK_wholesale_catalog_prices_product"
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "wholesale_catalog_prices"`);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        DROP CONSTRAINT IF EXISTS "FK_wholesale_catalog_prices_product"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_wholesale_catalog_prices_catalog_product"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_wholesale_catalog_prices_product_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        DROP COLUMN IF EXISTS "product_id",
        DROP COLUMN IF EXISTS "origin_country",
        DROP COLUMN IF EXISTS "origin_region",
        DROP COLUMN IF EXISTS "flavor_notes"
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD COLUMN IF NOT EXISTS "variant_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ALTER COLUMN "variant_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD CONSTRAINT "UQ_wholesale_catalog_prices_catalog_variant"
        UNIQUE ("catalog_id", "variant_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalog_prices"
        ADD CONSTRAINT "FK_wholesale_catalog_prices_variant"
        FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE
    `);
  }
}
