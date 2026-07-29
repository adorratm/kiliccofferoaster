import { MigrationInterface, QueryRunner } from 'typeorm';

const S3_BASE =
  'https://kiliccoffeeroaster-390403895418-eu-north-1-an.s3.eu-north-1.amazonaws.com';

/**
 * CMS / blog / ürün içeriklerindeki Unsplash URL’lerini S3 stock/* ile değiştirir.
 * Önce prod’da: yarn stock:upload
 */
export class ReplaceUnsplashWithStock1780000000000
  implements MigrationInterface
{
  name = 'ReplaceUnsplashWithStock1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const pairs: [string, string][] = [
      [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=2000&q=80',
        `${S3_BASE}/stock/hero.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
        `${S3_BASE}/stock/og.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80',
        `${S3_BASE}/stock/ethos.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=80',
        `${S3_BASE}/stock/ethos.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
        `${S3_BASE}/stock/workshop.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=80',
        `${S3_BASE}/stock/blog.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80',
        `${S3_BASE}/stock/blog.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=80',
        `${S3_BASE}/stock/product-4.jpg`,
      ],
      [
        'https://images.unsplash.com/photo-1610889556528-9a7707953b38?auto=format&fit=crop&w=1200&q=80',
        `${S3_BASE}/stock/product-5.jpg`,
      ],
    ];

    for (const [from, to] of pairs) {
      await queryRunner.query(
        `
        UPDATE content_sections
        SET content = replace(content::text, $1, $2)::jsonb,
            updated_at = now()
        WHERE content::text LIKE $3
        `,
        [from, to, `%${from}%`],
      );

      await queryRunner.query(
        `
        UPDATE site_settings
        SET value = replace(value::text, $1, $2)::jsonb,
            updated_at = now()
        WHERE value::text LIKE $3
        `,
        [from, to, `%${from}%`],
      );

      await queryRunner.query(
        `
        UPDATE blog_posts
        SET cover_image_url = $2,
            updated_at = now()
        WHERE cover_image_url = $1
        `,
        [from, to],
      );

      await queryRunner.query(
        `
        UPDATE products
        SET image_url = $2,
            updated_at = now()
        WHERE image_url = $1
        `,
        [from, to],
      );
    }

    // Kalan herhangi bir unsplash URL (query varyasyonları)
    await queryRunner.query(
      `
      UPDATE content_sections
      SET content = regexp_replace(
            content::text,
            'https://images\\.unsplash\\.com/[^"\\\\s]+',
            $1,
            'gi'
          )::jsonb,
          updated_at = now()
      WHERE content::text ILIKE '%unsplash.com%'
      `,
      [`${S3_BASE}/stock/hero.jpg`],
    );

    await queryRunner.query(
      `
      UPDATE site_settings
      SET value = regexp_replace(
            value::text,
            'https://images\\.unsplash\\.com/[^"\\\\s]+',
            $1,
            'gi'
          )::jsonb,
          updated_at = now()
      WHERE value::text ILIKE '%unsplash.com%'
      `,
      [`${S3_BASE}/stock/og.jpg`],
    );

    await queryRunner.query(
      `
      UPDATE blog_posts
      SET cover_image_url = $1,
          updated_at = now()
      WHERE cover_image_url ILIKE '%unsplash.com%'
      `,
      [`${S3_BASE}/stock/blog.jpg`],
    );

    await queryRunner.query(
      `
      UPDATE products
      SET image_url = $1,
          updated_at = now()
      WHERE image_url ILIKE '%unsplash.com%'
      `,
      [`${S3_BASE}/stock/product-1.jpg`],
    );

    // SEO ogImage boşsa stok OG ata
    await queryRunner.query(
      `
      UPDATE site_settings
      SET value = jsonb_set(
            COALESCE(value, '{}'::jsonb),
            '{ogImage}',
            to_jsonb($1::text),
            true
          ),
          updated_at = now()
      WHERE key = 'seo'
        AND (
          value->>'ogImage' IS NULL
          OR value->>'ogImage' = ''
          OR value->>'ogImage' ILIKE '%unsplash.com%'
        )
      `,
      [`${S3_BASE}/stock/og.jpg`],
    );
  }

  public async down(): Promise<void> {
    // Unsplash’a geri dönüş yok
  }
}
