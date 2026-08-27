import { MigrationInterface, QueryRunner } from 'typeorm';

export class GalleryItems1788000000000 implements MigrationInterface {
  name = 'GalleryItems1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gallery_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "source" varchar(20) NOT NULL,
        "instagram_id" varchar(64),
        "media_url" varchar(800) NOT NULL,
        "thumbnail_url" varchar(800),
        "permalink" varchar(800),
        "caption" text,
        "media_type" varchar(32) NOT NULL DEFAULT 'IMAGE',
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_visible" boolean NOT NULL DEFAULT true,
        "published_at" TIMESTAMPTZ,
        CONSTRAINT "PK_gallery_items" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_gallery_items_instagram_id"
      ON "gallery_items" ("instagram_id")
      WHERE "instagram_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_gallery_items_source_visible"
      ON "gallery_items" ("source", "is_visible", "sort_order")
    `);

    await this.insertMediaSections(queryRunner);
  }

  private async insertMediaSections(queryRunner: QueryRunner): Promise<void> {
    const sections = [
      {
        sectionKey: 'header',
        title: 'Medya Başlık',
        sortOrder: 1,
        content: {
          eyebrow: '01 // Medya',
          title: 'Atölyeden & Instagram',
          subtitle:
            'Kavrum anları, batch notları ve atölye yaşamından kareler. Instagram paylaşımlarımız ve seçilmiş görseller.',
          instagramLabel: 'Instagram',
          storiesLabel: 'Hikayeler',
          uploadsLabel: 'Atölyeden',
        },
      },
    ];

    for (const section of sections) {
      const exists = await queryRunner.query(
        `SELECT 1 FROM content_sections WHERE page = 'media' AND section_key = $1 LIMIT 1`,
        [section.sectionKey],
      );
      if (exists.length) continue;

      await queryRunner.query(
        `INSERT INTO content_sections (page, section_key, title, content, sort_order, is_published)
         VALUES ('media', $1, $2, $3::jsonb, $4, true)`,
        [
          section.sectionKey,
          section.title,
          JSON.stringify(section.content),
          section.sortOrder,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM content_sections WHERE page = 'media'`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gallery_items"`);
  }
}
