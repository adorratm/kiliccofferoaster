import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomBytes } from 'crypto';

/**
 * İşletmeye özel toptan katalog linkleri + varyant fiyat override.
 * Eski site_settings.wholesale_catalog kaydı varsa "Genel toptan katalog" olarak taşınır.
 */
export class WholesaleCatalogsPerBusiness1802000000000
  implements MigrationInterface
{
  name = 'WholesaleCatalogsPerBusiness1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wholesale_catalogs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "party_id" uuid,
        "business_name" varchar(200) NOT NULL,
        "token" varchar(64) NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "notes" text,
        CONSTRAINT "PK_wholesale_catalogs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wholesale_catalogs_party"
          FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wholesale_catalogs_token"
      ON "wholesale_catalogs" ("token")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_wholesale_catalogs_business_name"
      ON "wholesale_catalogs" ("business_name")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_wholesale_catalogs_party_id"
      ON "wholesale_catalogs" ("party_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wholesale_catalog_prices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "catalog_id" uuid NOT NULL,
        "variant_id" uuid NOT NULL,
        "price" decimal(12,2) NOT NULL,
        CONSTRAINT "PK_wholesale_catalog_prices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wholesale_catalog_prices_catalog_variant"
          UNIQUE ("catalog_id", "variant_id"),
        CONSTRAINT "FK_wholesale_catalog_prices_catalog"
          FOREIGN KEY ("catalog_id") REFERENCES "wholesale_catalogs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wholesale_catalog_prices_variant"
          FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_wholesale_catalog_prices_catalog_id"
      ON "wholesale_catalog_prices" ("catalog_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_wholesale_catalog_prices_variant_id"
      ON "wholesale_catalog_prices" ("variant_id")
    `);

    // Eski tek link → genel katalog
    const rows: Array<{ value: Record<string, unknown> }> =
      await queryRunner.query(
        `SELECT value FROM site_settings WHERE key = 'wholesale_catalog' LIMIT 1`,
      );

    if (rows.length) {
      const value = rows[0].value || {};
      const token =
        typeof value.token === 'string' && value.token.trim()
          ? value.token.trim()
          : randomBytes(24).toString('base64url');
      const enabled = value.enabled !== false;

      await queryRunner.query(
        `
        INSERT INTO wholesale_catalogs
          (id, business_name, token, is_enabled, notes, created_at, updated_at)
        SELECT gen_random_uuid(),
               'Genel toptan katalog',
               $1,
               $2,
               'Önceki tek paylaşım linkinden taşındı',
               now(),
               now()
        WHERE NOT EXISTS (
          SELECT 1 FROM wholesale_catalogs WHERE token = $1
        )
        `,
        [token, enabled],
      );

      await queryRunner.query(
        `DELETE FROM site_settings WHERE key = 'wholesale_catalog'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "wholesale_catalog_prices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wholesale_catalogs"`);
  }
}
