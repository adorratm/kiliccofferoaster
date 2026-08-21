import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Google / Apple / diğer OAuth kimliklerini aynı kullanıcıya bağlamak için
 * user_identities tablosu. Mevcut users.provider_id satırları taşınır.
 */
export class UserIdentities1786000000000 implements MigrationInterface {
  name = 'UserIdentities1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_identities" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "provider" "users_provider_enum" NOT NULL,
        "provider_id" varchar(255) NOT NULL,
        CONSTRAINT "UQ_user_identities_provider_provider_id"
          UNIQUE ("provider", "provider_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_identities_user_id"
      ON "user_identities" ("user_id")
    `);
    await queryRunner.query(`
      INSERT INTO "user_identities" (
        "id", "created_at", "updated_at", "user_id", "provider", "provider_id"
      )
      SELECT
        uuid_generate_v4(),
        now(),
        now(),
        u."id",
        u."provider",
        u."provider_id"
      FROM "users" u
      WHERE u."provider_id" IS NOT NULL
        AND u."provider"::text IN ('google', 'apple', 'facebook')
        AND NOT EXISTS (
          SELECT 1 FROM "user_identities" i
          WHERE i."provider" = u."provider"
            AND i."provider_id" = u."provider_id"
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_identities"`);
  }
}
