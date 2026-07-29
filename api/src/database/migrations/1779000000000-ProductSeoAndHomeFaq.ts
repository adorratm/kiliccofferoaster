import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ürün SEO alanları + ana sayfa FAQ içerik bölümü (yoksa ekler).
 */
export class ProductSeoAndHomeFaq1779000000000 implements MigrationInterface {
  name = 'ProductSeoAndHomeFaq1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "seo_title" varchar(220) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "seo_description" text NULL
    `);

    await queryRunner.query(`
      INSERT INTO "content_sections" (
        "id",
        "created_at",
        "updated_at",
        "page",
        "section_key",
        "title",
        "content",
        "sort_order",
        "is_published"
      )
      SELECT
        uuid_generate_v4(),
        now(),
        now(),
        'home',
        'faq',
        'SSS',
        $1::jsonb,
        6,
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM "content_sections"
        WHERE "page" = 'home' AND "section_key" = 'faq'
      )
    `, [
      JSON.stringify({
        title: 'Sıkça Sorulan Sorular',
        items: [
          {
            question: 'Kahveler ne sıklıkla kavruluyor?',
            answer:
              'Sipariş ve taze stok dengesi için batch bazlı kavrum yapıyoruz. Çekirdekler mümkün olduğunca taze kavrulmuş olarak gönderilir.',
          },
          {
            question: 'Öğütülmüş kahve sipariş edebilir miyim?',
            answer:
              'Varsayılan ürünlerimiz çekirdek olarak sunulur. Öğütme tercihinizi sipariş notunda belirtirseniz uygun öğütmeye göre hazırlarız.',
          },
          {
            question: 'Kargo süresi ne kadar?',
            answer:
              'Ödeme onayı sonrası siparişler genellikle 1–3 iş günü içinde kargoya verilir. Takip kodunu sipariş bildirimiyle paylaşıyoruz.',
          },
          {
            question: 'Atölyeyi ziyaret edebilir miyim?',
            answer:
              'Torbalı / İzmir atölyemizi ziyaret etmek için iletişim formundan veya telefonla randevu alabilirsiniz.',
          },
        ],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "content_sections"
      WHERE "page" = 'home' AND "section_key" = 'faq'
    `);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_description"
    `);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_title"
    `);
  }
}
