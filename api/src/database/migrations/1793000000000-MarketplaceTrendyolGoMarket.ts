import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * marketplace_accounts.platform enum'una trendyol_go_market ekler.
 */
export class MarketplaceTrendyolGoMarket1793000000000
  implements MigrationInterface
{
  name = 'MarketplaceTrendyolGoMarket1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "marketplace_accounts_platform_enum" ADD VALUE IF NOT EXISTS 'trendyol_go_market';
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    // PG enum değerleri güvenli şekilde geri alınamaz
  }
}
