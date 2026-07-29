import { MigrationInterface, QueryRunner } from 'typeorm';

const S3_BASE =
  'https://kiliccoffeeroaster-390403895418-eu-north-1-an.s3.eu-north-1.amazonaws.com';

/**
 * Hakkımızda sayfası için CMS content_sections kayıtları (yoksa ekler).
 */
export class AboutPageSections1781000000000 implements MigrationInterface {
  name = 'AboutPageSections1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.insertSection(queryRunner, {
      sectionKey: 'hero',
      title: 'Hakkımızda Hero',
      sortOrder: 1,
      content: {
        imageUrl: `${S3_BASE}/stock/workshop.jpg`,
        title: 'Hakkımızda',
        seoDescription:
          'Torbalı / İzmir’de batch bazlı specialty coffee kavurucusu. Veriye dayalı profil, taze kavrum ve atölye deneyimi.',
      },
    });

    await this.insertSection(queryRunner, {
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
    });

    await this.insertSection(queryRunner, {
      sectionKey: 'ethos',
      title: 'Hakkımızda Ethos Bandı',
      sortOrder: 3,
      content: {
        imageUrl: `${S3_BASE}/stock/ethos.jpg`,
        eyebrow: 'The Roasting Ethos',
        quote: 'Metodoloji veriye dayanır. Her batch için tutarlılık ölçülür.',
        linkLabel: 'Blog notlarını oku →',
        linkHref: '/blog',
      },
    });
  }

  private async insertSection(
    queryRunner: QueryRunner,
    section: {
      sectionKey: string;
      title: string;
      sortOrder: number;
      content: Record<string, unknown>;
    },
  ): Promise<void> {
    // FAQ migration ile aynı kalıp: yalnızca $1::jsonb parametre;
    // section_key literal — PG "inconsistent types deduced" hatasını önler.
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
        '${section.sectionKey}',
        '${section.title.replace(/'/g, "''")}',
        $1::jsonb,
        ${section.sortOrder},
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM "content_sections"
        WHERE "page" = 'about' AND "section_key" = '${section.sectionKey}'
      )
    `,
      [JSON.stringify(section.content)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "content_sections"
      WHERE "page" = 'about'
        AND "section_key" IN ('hero', 'body', 'ethos')
    `);
  }
}
