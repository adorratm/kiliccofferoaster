import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductRoastOptions1799000000000 implements MigrationInterface {
  name = 'ProductRoastOptions1799000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allow_roast_medium_dark" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allow_roast_dark" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "roast_option" varchar(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "roast_option" varchar(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "roast_label" varchar(80)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "roast_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "roast_option"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP COLUMN IF EXISTS "roast_option"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "allow_roast_dark"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "allow_roast_medium_dark"`,
    );
  }
}
