import { MigrationInterface, QueryRunner } from 'typeorm';

/** Toptan katalog işletme iletişim alanları */
export class WholesaleCatalogContactFields1803000000000
  implements MigrationInterface
{
  name = 'WholesaleCatalogContactFields1803000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalogs"
        ADD COLUMN IF NOT EXISTS "contact_person" varchar(120),
        ADD COLUMN IF NOT EXISTS "phone" varchar(40),
        ADD COLUMN IF NOT EXISTS "email" varchar(255),
        ADD COLUMN IF NOT EXISTS "address" varchar(400),
        ADD COLUMN IF NOT EXISTS "website" varchar(300)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "wholesale_catalogs"
        DROP COLUMN IF EXISTS "contact_person",
        DROP COLUMN IF EXISTS "phone",
        DROP COLUMN IF EXISTS "email",
        DROP COLUMN IF EXISTS "address",
        DROP COLUMN IF EXISTS "website"
    `);
  }
}
