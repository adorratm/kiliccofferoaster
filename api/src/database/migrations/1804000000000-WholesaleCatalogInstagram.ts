import { MigrationInterface, QueryRunner } from 'typeorm';

/** Toptan katalog işletme Instagram alanı */
export class WholesaleCatalogInstagram1804000000000
  implements MigrationInterface
{
  name = 'WholesaleCatalogInstagram1804000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalogs"
        ADD COLUMN IF NOT EXISTS "instagram" varchar(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalogs"
        DROP COLUMN IF EXISTS "instagram"
    `);
  }
}
