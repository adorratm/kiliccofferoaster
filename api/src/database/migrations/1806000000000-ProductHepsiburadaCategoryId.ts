import { MigrationInterface, QueryRunner } from 'typeorm';

/** Ürün başına Hepsiburada leaf kategori ID (MPOP katalog push). */
export class ProductHepsiburadaCategoryId1806000000000
  implements MigrationInterface
{
  name = 'ProductHepsiburadaCategoryId1806000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "hepsiburada_category_id" varchar(40)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP COLUMN IF EXISTS "hepsiburada_category_id"
    `);
  }
}
