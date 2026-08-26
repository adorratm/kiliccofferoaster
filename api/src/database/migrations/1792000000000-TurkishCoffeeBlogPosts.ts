import { MigrationInterface, QueryRunner } from 'typeorm';

const S3_BASE =
  'https://kilic-coffee-roaster.s3.eu-central-1.amazonaws.com';

type BlogSeed = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverKey: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  relatedProductSlugs: string[];
};

/** TypeORM JS dizisini parametre olarak yayar; PG text[] literal string kullan. */
function pgTextArrayLiteral(values: string[]): string {
  return `{${values
    .map((v) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',')}}`;
}

const POSTS: BlogSeed[] = [
  {
    slug: 'turk-kahvesi-nasil-demlenir',
    title: 'Türk Kahvesi Nasıl Demlenir?',
    excerpt:
      'Köpüğü düzgün, tadı dengeli bir fincan için oran, su ve ateş kontrolü yeter.',
    content: `<p>İyi Türk kahvesi şansa değil, birkaç sabit kurala bağlıdır. Torbalı’da kavurduğumuz Türk kahvesini evde aynı tutarlılıkta demlemek için şu başlangıç noktasını kullanın.</p>
<h2>Oran</h2>
<p>Kişi başı yaklaşık <strong>7 g kahve</strong> ve <strong>70–75 ml soğuk su</strong> ile başlayın. Daha koyu sevenler 8–9 g’a çıkabilir; fazla yüklemek köpüğü bozar, acılaştırır.</p>
<h2>Cezve ve ateş</h2>
<p>Kahveyi cezveye koyun, soğuk suyu ekleyin, karıştırın. Orta-düşük ateşte yavaşça ısıtın. Kaynamaya bırakmayın; köpük yükselirken ateşi kısın ve fincanlara paylaştırın. İsterseniz cezveyi kısa süre ateşe geri koyup ikinci köpük de alabilirsiniz.</p>
<h2>Şeker ve lokum</h2>
<p>Şekeri demlemeden önce ekleyin ki homojen erisin. Lokum veya su yanına gelince fincanın aroması daha net kalır.</p>
<p>Taze kavrulmuş, doğru incelikte öğütülmüş kahve kullanırsanız bu adımlar tek başına fincanı taşır. Siparişinizde öğütülmüş tercih edebilir veya çekirdek alıp kendi değirmeninizde Türk kahvesi inceliğine öğütebilirsiniz.</p>`,
    coverKey: 'product-1',
    tags: ['türk kahvesi', 'demleme'],
    seoTitle: 'Türk Kahvesi Nasıl Demlenir? | Oran ve Cezve İpuçları',
    seoDescription:
      'Evde köpüklü Türk kahvesi demleme: gramaj, su oranı, ateş kontrolü ve pratik cezve ipuçları.',
    relatedProductSlugs: ['turk-kahvesi'],
  },
  {
    slug: 'turk-kahvesi-ogutme-inceligi',
    title: 'Türk Kahvesi Öğütme İnceliği Neden Önemli?',
    excerpt:
      'Filtre veya espresso öğütümü Türk kahvesine uymaz; un kıvamında, eşit öğütüm gerekir.',
    content: `<p>Türk kahvesi, süzgeçten geçmeyen bir demleme yöntemidir. Bu yüzden öğütüm diğer yöntemlerden belirgin şekilde daha incedir — un kıvamına yakın, toz gibi.</p>
<h2>Yanlış öğütüm ne yapar?</h2>
<p><strong>Çok kaba</strong> öğütüm: köpük zayıf kalır, tat sulu ve eksik olur, dibe çökme düzensizleşir. <strong>Çok kaba + kısa demleme</strong> ise fincanı “çay gibi” bırakır.</p>
<p>Değirmeniniz Türk kahvesi ayarına inemiyorsa siparişte <strong>öğütülmüş</strong> seçeneğini kullanın; biz taze kavrumu doğru incelikte hazırlarız.</p>
<h2>Ne zaman çekirdek alınmalı?</h2>
<p>Evde burr değirmeniniz varsa ve her fincanı taze öğütebiliyorsanız çekirdek tercih edin. Aksi halde 100–250 g öğütülmüş paketler aroma kaybını sınırlar.</p>
<p>Kılıç Coffee Roaster Türk kahvesi, Torbalı atölyesinde kavrulur; gramaj ve öğütüm tercihini ürün sayfasından seçebilirsiniz.</p>`,
    coverKey: 'product-2',
    tags: ['türk kahvesi', 'öğütme'],
    seoTitle: 'Türk Kahvesi Öğütme İnceliği | Doğru Kıvam Rehberi',
    seoDescription:
      'Türk kahvesi neden un kıvamında öğütülür, yanlış öğütüm fincanı nasıl bozar ve ne zaman çekirdek alınır?',
    relatedProductSlugs: ['turk-kahvesi'],
  },
  {
    slug: 'turk-kahvesi-saklama-taze-kavrum',
    title: 'Türk Kahvesi Nasıl Saklanır?',
    excerpt:
      'Işık, nem ve hava aromayı yer. Taze kavrumu doğru saklamak fincanı korur.',
    content: `<p>Türk kahvesinde aroma yüzeyi çok geniştir: öğütülmüş kahve havayla hızla etkileşir. Saklama, demleme kadar belirleyicidir.</p>
<h2>Temel kurallar</h2>
<ul>
<li>Serin, kuru ve ışıksız yer; buzdolabı veya dondurucu önerilmez (nem ve koku).</li>
<li>Açtıktan sonra hava almayan, opak bir kap veya fermuarlı torba kullanın.</li>
<li>Öğütülmüşü mümkünse 2–3 hafta içinde bitirin; çekirdeği biraz daha uzun tutabilirsiniz.</li>
</ul>
<h2>Neden taze kavrum?</h2>
<p>Endüstriyel rafta uzun bekleyen kahve, cezvede köpük ve gövde kaybeder. Biz siparişe göre taze kavurup gönderiyoruz; Torbalı / İzmir’den çıkan paketler kısa sürede elinize ulaşır.</p>
<p>Ev tüketimi için 250 g veya 500 g, düzenli içiyorsanız 750 g–1 kg mantıklı seçeneklerdir. Stokta fazla tutmamak, her fincanın aynı kalitede kalmasını sağlar.</p>`,
    coverKey: 'workshop',
    tags: ['türk kahvesi', 'saklama'],
    seoTitle: 'Türk Kahvesi Nasıl Saklanır? | Taze Kavrum İpuçları',
    seoDescription:
      'Öğütülmüş ve çekirdek Türk kahvesini nasıl saklamalısınız? Nem, ışık ve taze kavrum için pratik rehber.',
    relatedProductSlugs: ['turk-kahvesi'],
  },
  {
    slug: 'turk-kahvesi-secim-rehberi',
    title: 'Türk Kahvesi Seçerken Nelere Bakmalı?',
    excerpt:
      'Kavrum seviyesi, taze tarih ve gramaj — alışverişte asıl farkı yaratan üç nokta.',
    content: `<p>“Türk kahvesi” etiketi tek başına kaliteyi garanti etmez. Alırken şu üç noktaya bakın.</p>
<h2>1. Kavrum ve tat profili</h2>
<p>Orta-koyu kavrum, klasik cezve tadında kakao, fındık ve hafif baharat notalarını taşır. Çok yanık / kömürsü kokulu paketlerden uzak durun; acılık demleme hatası değil, kavrum hatası olabilir.</p>
<h2>2. Taze kavrulmuş mu?</h2>
<p>Mümkünse kavurma tarihi veya “taze kavrum” iddiası olan yerli kavurucuları tercih edin. Torbalı’daki atölyemizde batch’leri küçük tutuyoruz; böylece rafta bekleyen stok yerine yeni kavrum çıkar.</p>
<h2>3. Gramaj ve öğütüm</h2>
<p>Önce 100–250 g deneyin; beğenirseniz 500 g veya 1 kg’a geçin. Evde değirmen yoksa öğütülmüş sipariş verin — yanlış incelik, pahalı kahveyi boşa harcatır.</p>
<p>Kılıç Coffee Roaster Türk kahvesini mağazadan gramaj ve öğütüm seçerek sipariş edebilirsiniz. Sorunuz varsa WhatsApp üzerinden de yazabilirsiniz.</p>`,
    coverKey: 'product-3',
    tags: ['türk kahvesi', 'rehber'],
    seoTitle: 'Türk Kahvesi Seçerken Nelere Bakmalı?',
    seoDescription:
      'Türk kahvesi alırken kavrum, tazelik ve gramaj nasıl seçilir? Torbalı kavurucusundan kısa alışveriş rehberi.',
    relatedProductSlugs: ['turk-kahvesi'],
  },
];

/**
 * Türk kahvesi blog yazılarını ekler ve turk-kahvesi ürününe bağlar.
 * Idempotent: slug varsa atlar; mevcut yazılarda boş related_product_slugs doldurulur.
 */
export class TurkishCoffeeBlogPosts1792000000000
  implements MigrationInterface
{
  name = 'TurkishCoffeeBlogPosts1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD COLUMN IF NOT EXISTS "related_product_slugs" text[] NOT NULL DEFAULT '{}'
    `);

    for (const post of POSTS) {
      await queryRunner.query(
        `
        INSERT INTO "blog_posts" (
          "id",
          "created_at",
          "updated_at",
          "slug",
          "title",
          "excerpt",
          "content",
          "cover_image_url",
          "author_name",
          "tags",
          "related_product_slugs",
          "seo_title",
          "seo_description",
          "is_published",
          "published_at",
          "locale"
        )
        SELECT
          uuid_generate_v4(),
          now(),
          now(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::text[],
          $8::text[],
          $9,
          $10,
          true,
          now(),
          'tr'
        WHERE NOT EXISTS (
          SELECT 1 FROM "blog_posts" WHERE "slug" = $1
        )
        `,
        [
          post.slug,
          post.title,
          post.excerpt,
          post.content,
          `${S3_BASE}/stock/${post.coverKey}.jpg`,
          'Kılıç Coffee Roaster',
          pgTextArrayLiteral(post.tags),
          pgTextArrayLiteral(post.relatedProductSlugs),
          post.seoTitle,
          post.seoDescription,
        ],
      );
    }

    await queryRunner.query(`
      UPDATE "blog_posts"
      SET
        "related_product_slugs" = ARRAY['turk-kahvesi']::text[],
        "updated_at" = now()
      WHERE "slug" = 'birinci-crack-nedir'
        AND (
          "related_product_slugs" IS NULL
          OR cardinality("related_product_slugs") = 0
        )
    `);

    await queryRunner.query(
      `
      UPDATE site_settings
      SET
        value = jsonb_set(
          COALESCE(value, '{}'::jsonb),
          '{googleReviewUrl}',
          to_jsonb($1::text),
          true
        ),
        updated_at = now()
      WHERE key = 'social'
        AND (
          COALESCE(value->>'googleReviewUrl', '') = ''
          OR NOT (COALESCE(value, '{}'::jsonb) ? 'googleReviewUrl')
        )
      `,
      ['https://g.page/r/CdfE3W3I-W53EAI/review'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM "blog_posts"
      WHERE "slug" = ANY($1::text[])
      `,
      [pgTextArrayLiteral(POSTS.map((p) => p.slug))],
    );
  }
}
