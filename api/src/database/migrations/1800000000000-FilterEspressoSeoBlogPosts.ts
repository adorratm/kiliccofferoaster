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
  relatedCategorySlugs: string[];
};

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlTextArray(values: string[]): string {
  if (values.length === 0) return `ARRAY[]::text[]`;
  return `ARRAY[${values.map(sqlString).join(', ')}]::text[]`;
}

/** Kategori SEO — GEO + ASO anahtar kelimeleriyle güçlendirilmiş */
const CATEGORIES: {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
}[] = [
  {
    slug: 'filtre-kahve',
    seoTitle: 'Filtre Kahve Çekirdekleri | Taze Kavrum İzmir Torbalı',
    seoDescription:
      'V60, Chemex, French Press ve batch brew için taze kavrulmuş filtre kahve. İzmir Ayrancılar / Torbalı atölyesinden çekirdek veya öğütülmüş sipariş.',
    description: `<p>Filtre kahve çekirdeklerimiz, berrak fincan ve menşei aromasını öne çıkarmak için açık–orta kavrumda tutulur. V60, Chemex, Kalita, AeroPress veya French Press için <strong>çekirdek</strong> ya da yönteme uygun <strong>öğütülmüş</strong> seçebilirsiniz.</p>
<p>Specialty filtre kahvede asidite, tatlılık ve gövde dengesi lot’a göre değişir: Etiyopya ve Kenya lotlarında çiçek–citrus; Orta Amerika’da kakao ve kuru meyve; Brezilya’da fındık ve yuvarlak gövde sık görülür. Kavrum tarihi ve tadım notları ürün sayfasında yer alır.</p>
<p>Başlangıç oranı <strong>1:15–1:17</strong> (ör. 15 g / 250 g su), su 92–96°C. Öğütümü yönteme göre ayarlayın; sipariş notunda “V60” veya “French Press” yazabilirsiniz. Torbalı Ayrancılar’dan taze kavrum İzmir ve Türkiye geneline kargolanır.</p>
<p>Rehber yazılarımızda demleme, öğütüm, saklama ve seçim ipuçlarını bulabilirsiniz. Google’da “İzmir filtre kahve” veya “Torbalı specialty kahve” arayanlar için bu kategori sayfası güncel kavrum listesini gösterir.</p>`,
  },
  {
    slug: 'espresso',
    seoTitle: 'Espresso Çekirdeği | Orta-Koyu & Koyu Kavrum | İzmir',
    seoDescription:
      'Espresso makinesi ve moka pot için taze kavrulmuş espresso çekirdeği. Orta-koyu ve koyu kavrum seçenekleri. İzmir Ayrancılar atölyesinden online sipariş.',
    description: `<p>Espresso çekirdeklerimiz, 25–30 saniyelik shot’ta <strong>tatlılık, gövde ve crema</strong> dengesini hedefler. Ev tipi makine, lever veya moka pot için çekirdek ya da espresso inceliği öğütüm seçebilirsiniz. Satın alma sırasında <strong>orta-koyu</strong> veya <strong>koyu</strong> kavrum tercihini ürün sayfasından belirleyebilirsiniz.</p>
<p>Tek köken espresso daha belirgin meyve ve asidite verir; blend’ler sütlü içeceklerde (latte, cappuccino) daha yuvarlak durur. Rafta bekleyen market poşetlerine göre taze kavrum, crema ve şeker hissini belirgin yükseltir.</p>
<p>Başlangıç oranı <strong>1:2</strong> (ör. 18 g kahve / 36 g espresso). Akış çok hızlıysa öğütümü inceltin; çok yavaşsa kabalaştırın. Moka pot için de aynı lotlar uygundur.</p>
<p>İzmir Torbalı Ayrancılar’daki atölyemizden kargo veya yerinde alım mümkündür. Espresso rehberlerimizde demleme, öğütüm, saklama ve çekirdek seçimini adım adım anlatıyoruz.</p>`,
  },
];

const POSTS: BlogSeed[] = [
  {
    slug: 'filtre-kahve-nasil-demlenir',
    title: 'Filtre Kahve Nasıl Demlenir?',
    excerpt:
      'V60’tan French Press’e: oran, su sıcaklığı ve süre ile dengeli filtre fincanı.',
    content: `<p>İyi filtre kahve, doğru oran + doğru öğütüm + taze kavrum üçlüsüne bağlıdır. Torbalı’da kavurduğumuz filtre lotlarını evde aynı tutarlılıkta demlemek için şu çerçeveyi kullanın.</p>
<h2>Oran ve su</h2>
<p>Başlangıç: <strong>1:16</strong> (15 g kahve / 240–250 g su). Daha yoğun sevenler 1:15, daha hafif sevenler 1:17 deneyebilir. Su 92–96°C; kaynar su floral lotları yakar.</p>
<h2>Yönteme göre süre</h2>
<ul>
<li><strong>V60 / Chemex:</strong> bloom 30–45 sn, toplam 2:30–3:30.</li>
<li><strong>French Press:</strong> 4 dk demleme, yavaş bastırma.</li>
<li><strong>Batch brew:</strong> ekipman reçetesine uyun; öğütümü orta-kaba tutun.</li>
</ul>
<h2>Taze kavrum farkı</h2>
<p>Kavurma tarihinden sonraki 3–21 gün çoğu filtre profilinde tatlılık ve aroma zirvesidir. Kılıç Coffee Roaster filtre kahve kategorisinden gramaj ve öğütüm seçerek sipariş verebilirsiniz.</p>`,
    coverKey: 'product-2',
    tags: ['filtre kahve', 'demleme'],
    seoTitle: 'Filtre Kahve Nasıl Demlenir? | Oran ve Süre Rehberi',
    seoDescription:
      'Evde filtre kahve demleme: V60, French Press oranı, su sıcaklığı ve taze kavrum ipuçları. İzmir Torbalı specialty.',
    relatedCategorySlugs: ['filtre-kahve'],
  },
  {
    slug: 'filtre-kahve-ogutme-inceligi',
    title: 'Filtre Kahve Öğütme İnceliği Neden Önemli?',
    excerpt:
      'Çok ince acılaştırır, çok kaba sululaştırır; yönteme göre orta–orta-kaba aralık gerekir.',
    content: `<p>Filtre demlemede su, kahveyle uzun temas eder ama Türk kahvesi veya espresso kadar ince öğütüm istemez. Hedef: eşit parçacık boyutu ve yönteme uygun incelik.</p>
<h2>Yönteme göre aralık</h2>
<ul>
<li><strong>V60 / Kalita:</strong> orta–orta-ince (deniz tuzu–kum arası).</li>
<li><strong>Chemex:</strong> biraz daha kaba (kalın filtre yavaş akar).</li>
<li><strong>French Press:</strong> orta-kaba; ince öğütüm bulanıklık ve acılık üretir.</li>
</ul>
<h2>Yanlış öğütüm</h2>
<p>Çok ince: tıkanma, acı, aşırı gövde. Çok kaba: hızlı akış, ekşi ve zayıf fincan. Değirmeniniz yoksa siparişte <strong>öğütülmüş</strong> seçin; not olarak yönteminizi yazın.</p>
<p>Kılıç Coffee Roaster filtre kahveleri Torbalı’da kavrulur; çekirdek veya öğütülmüş olarak gönderilir.</p>`,
    coverKey: 'blog',
    tags: ['filtre kahve', 'öğütme'],
    seoTitle: 'Filtre Kahve Öğütme İnceliği | V60 ve French Press',
    seoDescription:
      'Filtre kahve için doğru öğütüm: V60, Chemex, French Press ayarları ve öğütülmüş sipariş ne zaman tercih edilir?',
    relatedCategorySlugs: ['filtre-kahve'],
  },
  {
    slug: 'filtre-kahve-saklama-taze-kavrum',
    title: 'Filtre Kahve Nasıl Saklanır?',
    excerpt:
      'Light–orta kavrum aroması hassastır; ışık, nem ve hava fincanı bozar.',
    content: `<p>Filtre profilleri genellikle daha açık kavrulduğu için uçucu aromalar (çiçek, citrus) hızla kaybolabilir. Saklama, demleme kadar kritiktir.</p>
<h2>Temel kurallar</h2>
<ul>
<li>Serin, kuru, ışıksız yer; buzdolabı önerilmez.</li>
<li>Açtıktan sonra hava almayan, opak kap veya valve’li torba.</li>
<li>Çekirdeği mümkünse demlemeden hemen önce öğütün; öğütülmüşü 1–2 haftada bitirin.</li>
</ul>
<h2>Neden taze kavrum?</h2>
<p>Endüstriyel rafta bekleyen “filtre kahve” poşetleri menşei notalarını kaybeder. Biz siparişe yakın kavurup İzmir’den gönderiyoruz; 250–500 g ev tüketimi için idealdir.</p>`,
    coverKey: 'workshop',
    tags: ['filtre kahve', 'saklama'],
    seoTitle: 'Filtre Kahve Nasıl Saklanır? | Taze Kavrum İpuçları',
    seoDescription:
      'Filtre kahve çekirdeğini nasıl saklamalısınız? Nem, ışık ve taze kavrum için pratik rehber — İzmir Torbalı.',
    relatedCategorySlugs: ['filtre-kahve'],
  },
  {
    slug: 'filtre-kahve-secim-rehberi',
    title: 'Filtre Kahve Seçerken Nelere Bakmalı?',
    excerpt:
      'Menşei, kavrum, işlem yöntemi ve gramaj — alışverişte fark yaratan dört nokta.',
    content: `<p>“Filtre kahve” etiketi tek başına kaliteyi garanti etmez. Alırken şu noktalara bakın.</p>
<h2>1. Menşei ve işlem</h2>
<p>Yıkanmış (washed) lotlar daha temiz ve asidik; natural lotlar daha meyvemsi ve tatlı olabilir. Ürün sayfasındaki ülke / bölge / işlem bilgisi şeffaflık işaretidir.</p>
<h2>2. Kavrum seviyesi</h2>
<p>Filtre için açık–orta kavrum berraklığı korur. Çok koyu kavrum filtrede kül ve acılık üretebilir; espresso için ayrı kategoriye bakın.</p>
<h2>3. Tazelik ve gramaj</h2>
<p>Önce 250 g deneyin; beğenirseniz 500 g–1 kg’a geçin. Kavrum tarihi veya “taze kavrum” iddiası somut olmalı.</p>
<p>Kılıç Coffee Roaster filtre kahve kategorisinden V60 / French Press uyumlu lotları seçebilir, WhatsApp’tan da sorabilirsiniz.</p>`,
    coverKey: 'product-3',
    tags: ['filtre kahve', 'rehber'],
    seoTitle: 'Filtre Kahve Seçerken Nelere Bakmalı?',
    seoDescription:
      'Filtre kahve alırken menşei, kavrum, işlem ve gramaj nasıl seçilir? Torbalı kavurucusundan kısa rehber.',
    relatedCategorySlugs: ['filtre-kahve'],
  },
  {
    slug: 'espresso-ogutme-inceligi',
    title: 'Espresso Öğütme İnceliği Neden Önemli?',
    excerpt:
      'Shot süresi öğütümle yönetilir; yanlış incelik channeling veya tıkanma üretir.',
    content: `<p>Espresso, kısa sürede yüksek basınçla ekstrakte edilir. Bu yüzden öğütüm Türk kahvesinden kaba, filtreden belirgin şekilde incedir — ama “toz” kadar ince değildir.</p>
<h2>Akış nasıl okunur?</h2>
<p><strong>Çok hızlı shot</strong> (ör. 15 sn’de 36 g): öğütüm kabadır → inceltin. <strong>Çok yavaş / tıkanma</strong>: öğütüm incedir veya sepet aşırı doldurulmuştur → kabalaştırın veya dozajı düşürün.</p>
<h2>Öğütülmüş mü, çekirdek mi?</h2>
<p>Hazır “espresso öğütülmüş” poşetler sizin makinenizin sepetine uymaz. Değirmeniniz varsa çekirdek alın; yoksa siparişte öğütülmüş + “espresso makinesi” notu bırakın, yine de evde ince ayar gerekebilir.</p>
<p>Kılıç Coffee Roaster espresso kategorisindeki lotlar ev makinesi ve moka pot için seçilir; orta-koyu / koyu kavrum seçeneklerini ürün sayfasından işaretleyebilirsiniz.</p>`,
    coverKey: 'product-1',
    tags: ['espresso', 'öğütme'],
    seoTitle: 'Espresso Öğütme İnceliği | Shot Ayarı Rehberi',
    seoDescription:
      'Espresso öğütümü neden kritik? Hızlı/yavaş shot, channeling ve çekirdek vs öğütülmüş sipariş ipuçları.',
    relatedCategorySlugs: ['espresso'],
  },
  {
    slug: 'espresso-saklama-taze-kavrum',
    title: 'Espresso Çekirdeği Nasıl Saklanır?',
    excerpt:
      'Crema ve tatlılık taze kavrum ister; açılan paket havayla hızla bozulur.',
    content: `<p>Espresso’da crema ve şeker hissi, taze kavrulmuş çekirdekte daha belirgindir. Saklama bozulursa shot “düz” ve acılaşır.</p>
<h2>Temel kurallar</h2>
<ul>
<li>Valve’li veya hava almayan opak kap; mutfak tezgâhında açık torba bırakmayın.</li>
<li>Buzdolabı / dondurucu: nem ve koku riski — önerilmez.</li>
<li>Öğütülmüş espresso çok hızlı bayatlar; mümkünse çekirdek saklayıp her seferinde öğütün.</li>
</ul>
<h2>Ne kadar alınmalı?</h2>
<p>Haftalık tüketiminize göre 250–500 g idealdir. Torbalı atölyemizden taze çıkan paketler kısa sürede elinize ulaşır; stokta fazla tutmamak kaliteyi korur.</p>`,
    coverKey: 'workshop',
    tags: ['espresso', 'saklama'],
    seoTitle: 'Espresso Çekirdeği Nasıl Saklanır? | Taze Kavrum',
    seoDescription:
      'Espresso çekirdeğini nasıl saklamalısınız? Crema, nem ve taze kavrum için pratik rehber — İzmir Ayrancılar.',
    relatedCategorySlugs: ['espresso'],
  },
  {
    slug: 'espresso-secim-rehberi',
    title: 'Espresso Çekirdeği Seçerken Nelere Bakmalı?',
    excerpt:
      'Kavrum (orta-koyu / koyu), tek köken vs blend ve makinenize uyum.',
    content: `<p>“Espresso çekirdeği” botanikte ayrı bir tür değildir; shot’a uygun kavrulmuş Arabica (bazen Robusta karışımı) demektir. Seçerken şunlara bakın.</p>
<h2>1. Kavrum seviyesi</h2>
<p><strong>Orta-koyu:</strong> tatlılık + gövde dengesi, sütlü içeceklerde bağışlayıcı. <strong>Koyu:</strong> daha yoğun, bitter-çikolata; aşırı yanık kokulu paketlerden uzak durun. Ürün sayfamızda bu seçenekleri açıp kapatabiliyoruz.</p>
<h2>2. Tek köken mi, blend mi?</h2>
<p>Tek köken karakterlidir (meyve, çiçek). Blend’ler gün gün daha öngörülebilirdir — cafe tarzı latte için sık tercih edilir.</p>
<h2>3. Tazelik ve öğütüm</h2>
<p>Kavrum tarihi veya taze kavrum iddiası somut olmalı. Makineniz varsa çekirdek alın. Moka pot kullanıyorsanız aynı lotlar genelde uyumludur.</p>
<p>Kılıç Coffee Roaster espresso kategorisinden sipariş verebilir; detay için WhatsApp’tan yazabilirsiniz.</p>`,
    coverKey: 'product-3',
    tags: ['espresso', 'rehber'],
    seoTitle: 'Espresso Çekirdeği Seçerken Nelere Bakmalı?',
    seoDescription:
      'Espresso çekerken kavrum, tek köken/blend ve tazelik nasıl seçilir? İzmir Torbalı specialty rehberi.',
    relatedCategorySlugs: ['espresso'],
  },
];

/**
 * Filtre kahve + espresso için Türk kahvesi ile aynı disiplinde
 * 4’lü rehber blog kümesi, kategori SEO/GEO metinleri ve site keywords.
 * Prod’da idempotent çalışır (slug varsa atlar).
 */
export class FilterEspressoSeoBlogPosts1800000000000
  implements MigrationInterface
{
  name = 'FilterEspressoSeoBlogPosts1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD COLUMN IF NOT EXISTS "related_category_slugs" text[] NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD COLUMN IF NOT EXISTS "related_product_slugs" text[] NOT NULL DEFAULT '{}'
    `);

    for (const cat of CATEGORIES) {
      await queryRunner.query(
        `
        UPDATE "categories"
        SET
          "seo_title" = $1,
          "seo_description" = $2,
          "description" = $3,
          "updated_at" = now()
        WHERE "slug" = $4
        `,
        [cat.seoTitle, cat.seoDescription, cat.description, cat.slug],
      );
    }

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
          "related_category_slugs",
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
          ${sqlTextArray(post.tags)},
          ARRAY[]::text[],
          ${sqlTextArray(post.relatedCategorySlugs)},
          $7,
          $8,
          true,
          now(),
          'tr'
        WHERE NOT EXISTS (
          SELECT 1 FROM "blog_posts" WHERE "slug" = $9
        )
        `,
        [
          post.slug,
          post.title,
          post.excerpt,
          post.content,
          `${S3_BASE}/stock/${post.coverKey}.jpg`,
          'Kılıç Coffee Roaster',
          post.seoTitle,
          post.seoDescription,
          post.slug,
        ],
      );

      // Daha önce eklenmişse kategori bağını ve SEO’yu tazele
      await queryRunner.query(
        `
        UPDATE "blog_posts"
        SET
          "related_category_slugs" = ${sqlTextArray(post.relatedCategorySlugs)},
          "seo_title" = $1,
          "seo_description" = $2,
          "title" = $3,
          "excerpt" = $4,
          "updated_at" = now()
        WHERE "slug" = $5
        `,
        [
          post.seoTitle,
          post.seoDescription,
          post.title,
          post.excerpt,
          post.slug,
        ],
      );
    }

    // Mevcut demleme yazılarına kategori bağını garanti et
    await queryRunner.query(`
      UPDATE "blog_posts"
      SET
        "related_category_slugs" = ARRAY['filtre-kahve']::text[],
        "updated_at" = now()
      WHERE "slug" IN (
        'v60-nasil-yapilir',
        'french-press-nasil-yapilir',
        'filtre-kahve-ogutme-ipuclari'
      )
    `);

    await queryRunner.query(`
      UPDATE "blog_posts"
      SET
        "related_category_slugs" = ARRAY['espresso']::text[],
        "updated_at" = now()
      WHERE "slug" IN (
        'espresso-nasil-yapilir',
        'moka-pot-nasil-kullanilir',
        'espresso-icin-hangi-cekirdek'
      )
    `);

    // Site SEO keywords — ASO / Search Console ile hizalı
    await queryRunner.query(`
      UPDATE site_settings
      SET
        value = jsonb_set(
          jsonb_set(
            jsonb_set(
              value,
              '{keywords}',
              $1::jsonb,
              true
            ),
            '{description}',
            to_jsonb($2::text),
            true
          ),
          '{title}',
          to_jsonb($3::text),
          true
        ),
        updated_at = now()
      WHERE key = 'seo'
    `, [
      JSON.stringify([
        'kahve',
        'specialty coffee',
        'taze kavrulmuş kahve',
        'filtre kahve',
        'espresso',
        'türk kahvesi',
        'espresso çekirdeği',
        'filtre kahve çekirdekleri',
        'İzmir',
        'Torbalı',
        'Ayrancılar',
        'Kılıç Coffee Roaster',
      ]),
      'İzmir Ayrancılar’da taze kavrulan specialty kahveler. Filtre kahve, espresso ve Türk kahvesi çekirdeklerini keşfedin. Kılıç Coffee Roaster’dan online sipariş.',
      'Kılıç Coffee Roaster | Filtre · Espresso · Türk Kahvesi | İzmir',
    ]);

    // Kategori ürünlerinden related_product_slugs doldur (boş olanlar)
    await queryRunner.query(`
      UPDATE "blog_posts" AS bp
      SET
        "related_product_slugs" = sub.slugs,
        "updated_at" = now()
      FROM (
        SELECT
          c.slug AS cat_slug,
          ARRAY(
            SELECT p.slug
            FROM products p
            WHERE p.category_id = c.id
              AND p.is_active = true
            ORDER BY p.is_featured DESC, p.name ASC
            LIMIT 2
          ) AS slugs
        FROM categories c
        WHERE c.slug IN ('filtre-kahve', 'espresso')
      ) sub
      WHERE cardinality(bp.related_product_slugs) = 0
        AND cardinality(sub.slugs) > 0
        AND sub.cat_slug = ANY (bp.related_category_slugs)
        AND bp.slug IN (
          'filtre-kahve-nasil-demlenir',
          'filtre-kahve-ogutme-inceligi',
          'filtre-kahve-saklama-taze-kavrum',
          'filtre-kahve-secim-rehberi',
          'espresso-ogutme-inceligi',
          'espresso-saklama-taze-kavrum',
          'espresso-secim-rehberi',
          'v60-nasil-yapilir',
          'french-press-nasil-yapilir',
          'filtre-kahve-ogutme-ipuclari',
          'espresso-nasil-yapilir',
          'moka-pot-nasil-kullanilir',
          'espresso-icin-hangi-cekirdek'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = POSTS.map((p) => sqlString(p.slug)).join(', ');
    await queryRunner.query(`
      DELETE FROM "blog_posts" WHERE "slug" IN (${slugs})
    `);
  }
}
