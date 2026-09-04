import { MigrationInterface, QueryRunner } from 'typeorm';

export class MobileClientEvents1798000000000 implements MigrationInterface {
  name = 'MobileClientEvents1798000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mobile_client_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "event" varchar(64) NOT NULL,
        "platform" varchar(16),
        "app_version" varchar(32),
        "runtime_version" varchar(64),
        "update_channel" varchar(64),
        "order_number" varchar(64),
        "session_id" varchar(120),
        "meta" jsonb
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mobile_client_events_event"
      ON "mobile_client_events" ("event")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mobile_client_events_created"
      ON "mobile_client_events" ("created_at" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mobile_client_events"`);
  }
}
