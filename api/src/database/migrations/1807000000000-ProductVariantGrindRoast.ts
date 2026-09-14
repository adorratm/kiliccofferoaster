import { MigrationInterface, QueryRunner } from 'typeorm';

/** Gramaj varyantına öğütme + kavrum (ayrı SKU / HB listing). */
export class ProductVariantGrindRoast1807000000000
  implements MigrationInterface
{
  name = 'ProductVariantGrindRoast1807000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "grind_option" varchar(40)
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        ADD COLUMN IF NOT EXISTS "roast_option" varchar(40)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        DROP COLUMN IF EXISTS "roast_option"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
        DROP COLUMN IF EXISTS "grind_option"
    `);
  }
}
