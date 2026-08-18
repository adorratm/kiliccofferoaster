import { MigrationInterface, QueryRunner } from 'typeorm';

export class InAppNotifications1783000000000 implements MigrationInterface {
  name = 'InAppNotifications1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "in_app_notifications_audience_enum" AS ENUM ('user', 'ops');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "in_app_notifications_category_enum" AS ENUM (
          'orders', 'shipping', 'returns', 'account', 'marketing',
          'ops_orders', 'ops_returns', 'ops_messages', 'ops_reviews', 'ops_stock'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "device_push_tokens_platform_enum" AS ENUM (
          'ios', 'android', 'web', 'desktop', 'unknown'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "in_app_notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "audience" "in_app_notifications_audience_enum" NOT NULL,
        "category" "in_app_notifications_category_enum" NOT NULL,
        "type" varchar(80) NOT NULL,
        "title" varchar(180) NOT NULL,
        "body" text NOT NULL,
        "href" varchar(400) NULL,
        "order_id" uuid NULL,
        "read_at" TIMESTAMPTZ NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_in_app_notifications_user_id"
      ON "in_app_notifications" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_in_app_notifications_category"
      ON "in_app_notifications" ("category")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_in_app_notifications_read_at"
      ON "in_app_notifications" ("read_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "in_app_enabled" boolean NOT NULL DEFAULT true,
        "push_enabled" boolean NOT NULL DEFAULT true,
        "orders_enabled" boolean NOT NULL DEFAULT true,
        "shipping_enabled" boolean NOT NULL DEFAULT true,
        "returns_enabled" boolean NOT NULL DEFAULT true,
        "account_enabled" boolean NOT NULL DEFAULT true,
        "marketing_enabled" boolean NOT NULL DEFAULT true,
        "ops_orders_enabled" boolean NOT NULL DEFAULT true,
        "ops_returns_enabled" boolean NOT NULL DEFAULT true,
        "ops_messages_enabled" boolean NOT NULL DEFAULT true,
        "ops_reviews_enabled" boolean NOT NULL DEFAULT true,
        "ops_stock_enabled" boolean NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_push_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" varchar(400) NOT NULL UNIQUE,
        "platform" "device_push_tokens_platform_enum" NOT NULL DEFAULT 'unknown',
        "is_active" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_device_push_tokens_user_id"
      ON "device_push_tokens" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "device_push_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "in_app_notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "device_push_tokens_platform_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "in_app_notifications_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "in_app_notifications_audience_enum"`);
  }
}
