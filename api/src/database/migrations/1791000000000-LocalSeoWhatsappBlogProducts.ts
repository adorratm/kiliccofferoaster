import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Canlıda build/migration ile:
 * - blog_posts.related_product_slugs
 * - site_settings.whatsapp (yoksa)
 * - social.googleReviewUrl
 * - seo / hero / footerNav yerel SEO güncellemeleri
 */
export class LocalSeoWhatsappBlogProducts1791000000000
  implements MigrationInterface
{
  name = 'LocalSeoWhatsappBlogProducts1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD COLUMN IF NOT EXISTS "related_product_slugs" text[] NOT NULL DEFAULT '{}'
    `);

    const whatsapp = {
      enabled: true,
      phone: '',
      greeting:
        'Merhaba — Kılıç Coffee Roaster. Size nasıl yardımcı olabiliriz?',
      presets: [
        {
          label: 'Sipariş durumu',
          message:
            'Merhaba, sipariş durumum hakkında bilgi almak istiyorum.',
        },
        {
          label: 'Kavrum önerisi',
          message:
            'Merhaba, damak zevkime / demleme yöntemime uygun kavrum önerisi alabilir miyim?',
        },
        {
          label: 'Toptan / işletme',
          message:
            'Merhaba, toptan / işletme siparişi hakkında bilgi almak istiyorum.',
        },
        {
          label: 'Kargo & teslimat',
          message:
            'Merhaba, kargo süresi ve teslimat seçenekleri hakkında yazıyorum.',
        },
        {
          label: 'Başka bir konu',
          message: 'Merhaba, Kılıç Coffee Roaster hakkında yazıyorum.',
        },
      ],
    };

    await queryRunner.query(
      `
      INSERT INTO site_settings (id, key, value, "group", description, created_at, updated_at)
      SELECT gen_random_uuid(), 'whatsapp', $1::jsonb, 'whatsapp', 'WhatsApp sohbet ayarları', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE key = 'whatsapp')
      `,
      [JSON.stringify(whatsapp)],
    );

    await queryRunner.query(`
      UPDATE site_settings
      SET value = jsonb_set(
            COALESCE(value, '{}'::jsonb),
            '{googleReviewUrl}',
            '""'::jsonb,
            true
          ),
          updated_at = now()
      WHERE key = 'social'
        AND NOT (COALESCE(value, '{}'::jsonb) ? 'googleReviewUrl')
    `);

    await queryRunner.query(
      `
      UPDATE site_settings
      SET value = value
            || jsonb_build_object(
              'title', $1::text,
              'description', $2::text,
              'keywords', $3::jsonb
            ),
          updated_at = now()
      WHERE key = 'seo'
        AND (
          COALESCE(value->>'title', '') = 'Kılıç Coffee Roaster'
          OR COALESCE(value->>'title', '') = ''
        )
      `,
      [
        'Kılıç Coffee Roaster | Ayrancılar, Torbalı İzmir',
        'İzmir Torbalı Ayrancılar’da taze kavrulmuş specialty kahve çekirdekleri. Espresso, filtre ve Türk kahvesi için kavrumları online veya atölyeden alın.',
        JSON.stringify([
          'kahve',
          'kavurma',
          'specialty coffee',
          'Ayrancılar',
          'Torbalı',
          'İzmir',
          'kahve çekirdeği',
          'taze kavrulmuş kahve',
          'Kılıç Coffee Roaster',
        ]),
      ],
    );

    await queryRunner.query(
      `
      UPDATE content_sections
      SET content = content || $1::jsonb,
          updated_at = now()
      WHERE page = 'home'
        AND section_key = 'hero'
      `,
      [
        JSON.stringify({
          eyebrow: 'EST. 2026 / AYRANCILAR · TORBALI · İZMİR',
          description:
            'İzmir Torbalı Ayrancılar’daki kahve kavurma atölyemizde özenle kavrulan specialty çekirdekleri keşfedin. Espresso, filtre ve Türk kahvesi için taze kavrum.',
          ctaSecondary: {
            label: 'Sana uygun kahve',
            href: '/oner',
          },
        }),
      ],
    );

    // footerNav’a /oner /toptan /yorum ekle (yoksa)
    await queryRunner.query(`
      UPDATE site_settings
      SET value = jsonb_set(
            value,
            '{footerNav}',
            COALESCE(value->'footerNav', '[]'::jsonb)
              || CASE
                   WHEN EXISTS (
                     SELECT 1
                     FROM jsonb_array_elements(COALESCE(value->'footerNav', '[]'::jsonb)) el
                     WHERE el->>'href' = '/oner'
                   ) THEN '[]'::jsonb
                   ELSE '[{"href":"/oner","label":"Kahve Seçici"}]'::jsonb
                 END
              || CASE
                   WHEN EXISTS (
                     SELECT 1
                     FROM jsonb_array_elements(COALESCE(value->'footerNav', '[]'::jsonb)) el
                     WHERE el->>'href' = '/toptan'
                   ) THEN '[]'::jsonb
                   ELSE '[{"href":"/toptan","label":"Toptan"}]'::jsonb
                 END
              || CASE
                   WHEN EXISTS (
                     SELECT 1
                     FROM jsonb_array_elements(COALESCE(value->'footerNav', '[]'::jsonb)) el
                     WHERE el->>'href' = '/yorum'
                   ) THEN '[]'::jsonb
                   ELSE '[{"href":"/yorum","label":"Google Yorum"}]'::jsonb
                 END,
            true
          ),
          updated_at = now()
      WHERE key = 'navigation'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      DROP COLUMN IF EXISTS "related_product_slugs"
    `);
    await queryRunner.query(`
      DELETE FROM site_settings WHERE key = 'whatsapp'
    `);
  }
}
