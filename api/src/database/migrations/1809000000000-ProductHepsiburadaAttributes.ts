import { MigrationInterface, QueryRunner } from 'typeorm';

/** Ürün başına HB attribute override (enum eşleşmesi için). */
export class ProductHepsiburadaAttributes1809000000000
  implements MigrationInterface
{
  name = 'ProductHepsiburadaAttributes1809000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "hepsiburada_attributes" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP COLUMN IF EXISTS "hepsiburada_attributes"
    `);
  }
}
