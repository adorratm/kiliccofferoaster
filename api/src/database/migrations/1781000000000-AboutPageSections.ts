import { MigrationInterface, QueryRunner } from 'typeorm';

const S3_BASE =
  'https://kiliccoffeeroaster-390403895418-eu-north-1-an.s3.eu-north-1.amazonaws.com';

/**
 * Hakkımızda sayfası için CMS content_sections kayıtları (yoksa ekler).
 */
export class AboutPageSections1781000000000 implements MigrationInterface {
  name = 'AboutPageSections1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sections: Array<{
      sectionKey: string;
      title: string;
      sortOrder: number;
      content: Record<string, unknown>;
    }> = [
      {
        sectionKey: 'hero',
        title: 'Hakkımızda Hero',
        sortOrder: 1,
        content: {
          imageUrl: `${S3_BASE}/stock/workshop.jpg`,
          title: 'Hakkımızda',
          seoDescription:
            'Torbalı / İzmir’de batch bazlı specialty coffee kavurucusu. Veriye dayalı profil, taze kavrum ve atölye deneyimi.',
        },
      },
      {
        sectionKey: 'body',
        title: 'Hakkımızda İçerik',
        sortOrder: 2,
        content: {
          titleLine1: 'Torbalı’dan',
          titleLine2: 'ölçülen kavrum',
          paragraphs: [
            'Kılıç Coffee Roaster, Ayrancılar / Torbalı merkezinde batch bazlı specialty coffee üretir. Her profil termal eğri, hava akışı ve drum hızı ile izlenir; tutarlılık veriye, derinlik ise tadım disiplinine dayanır.',
            'Amacımız raflara stok kahve koymak değil; taze kavrulmuş, izlenebilir ve demlemeye hazır çekirdek sunmaktır. Ev baristasından kafeye, aynı kalite standardını koruruz.',
            'Atölyemizi ziyaret etmek, toptan iş birliği veya kavrum profili konuşmak için iletişime geçebilirsiniz.',
          ],
          ctaPrimary: { label: 'Kavrumları İncele', href: '/urunler' },
          ctaSecondary: { label: 'İletişim', href: '/iletisim' },
          showContactAside: true,
        },
      },
      {
        sectionKey: 'ethos',
        title: 'Hakkımızda Ethos Bandı',
        sortOrder: 3,
        content: {
          imageUrl: `${S3_BASE}/stock/ethos.jpg`,
          eyebrow: 'The Roasting Ethos',
          quote:
            'Metodoloji veriye dayanır. Her batch için tutarlılık ölçülür.',
          linkLabel: 'Blog notlarını oku →',
          linkHref: '/blog',
        },
      },
    ];

    for (const section of sections) {
      await queryRunner.query(
        `
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
          'about',
          $1,
          $2,
          $3::jsonb,
          $4,
          true
        WHERE NOT EXISTS (
          SELECT 1 FROM "content_sections"
          WHERE "page" = 'about' AND "section_key" = $1
        )
      `,
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
    await queryRunner.query(`
      DELETE FROM "content_sections"
      WHERE "page" = 'about'
        AND "section_key" IN ('hero', 'body', 'ethos')
    `);
  }
}
