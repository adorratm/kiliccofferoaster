import { MigrationInterface, QueryRunner } from 'typeorm';

/** Pazaryeri API istek/yanıt logları (HB import debug). */
export class MarketplaceApiLogs1808000000000 implements MigrationInterface {
  name = 'MarketplaceApiLogs1808000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "marketplace_api_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "account_id" uuid NOT NULL,
        "platform" varchar(40) NOT NULL,
        "action" varchar(80) NOT NULL,
        "method" varchar(10),
        "url" text,
        "product_id" uuid,
        "variant_id" uuid,
        "merchant_sku" varchar(120),
        "request_body" jsonb,
        "response_status" int,
        "response_body" jsonb,
        "error_message" text,
        "success" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_marketplace_api_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_marketplace_api_logs_account"
          FOREIGN KEY ("account_id") REFERENCES "marketplace_accounts"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_api_logs_account_id"
        ON "marketplace_api_logs" ("account_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_api_logs_platform"
        ON "marketplace_api_logs" ("platform")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_api_logs_action"
        ON "marketplace_api_logs" ("action")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_api_logs_product_id"
        ON "marketplace_api_logs" ("product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_api_logs_merchant_sku"
        ON "marketplace_api_logs" ("merchant_sku")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_api_logs_created_at"
        ON "marketplace_api_logs" ("created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "marketplace_api_logs"`);
  }
}
