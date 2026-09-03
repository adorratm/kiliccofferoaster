import { MigrationInterface, QueryRunner } from 'typeorm';

const S3_BASE = 'https://kilic-coffee-roaster.s3.eu-central-1.amazonaws.com';

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
  relatedCategorySlugs: string[];
};

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlTextArray(values: string[]): string {
  if (values.length === 0) return `ARRAY[]::text[]`;
  return `ARRAY[${values.map(sqlString).join(', ')}]::text[]`;
}

const CATEGORIES: {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
}[] = [
  {
    slug: 'turk-kahvesi',
    seoTitle: 'Taze Kavrulmuş Türk Kahvesi | İzmir',
    seoDescription:
      'İzmir Ayrancılar’da taze kavrulan Türk kahvesi çekirdekleri. Cezve için öğütülmüş veya çekirdek sipariş verin.',
    description: `<p>Kılıç Coffee Roaster Türk kahvesi, Torbalı Ayrancılar’daki atölyede küçük batch’ler halinde kavrulur. Cezvede köpük, gövde ve dengeli acılık için orta-koyu profile yakın tutarız.</p>
<p>Çekirdek veya öğütülmüş seçebilirsiniz. Öğütülmüş siparişlerde Türk kahvesi inceliği (un kıvamı) kullanılır. Evde değirmeniniz varsa çekirdek alıp her fincanı taze öğütmek daha iyi aroma verir.</p>
<p>Taze kavrulmuş Türk kahvesi, rafta bekleyen endüstriyel paketlere göre fincanda daha net çikolata, fındık ve baharat notası taşır. Gramajı ihtiyacınıza göre seçin; açıldıktan sonra hava almayan kapta saklayın.</p>`,
  },
  {
    slug: 'filtre-kahve',
    seoTitle: 'Filtre Kahve Çekirdekleri | Taze Kavrum İzmir',
    seoDescription:
      'V60, Chemex ve French Press için taze kavrulmuş filtre kahve çekirdekleri. İzmir Torbalı atölyesinden.',
    description: `<p>Filtre kahve çekirdeklerimiz, berrak fincan ve meyvemsi asidite için daha açık veya orta kavrumda tutulur. V60, Chemex, kalita veya French Press için çekirdek ya da uygun öğütüm seçebilirsiniz.</p>
<p>Specialty kahvede filtre, çekirdeğin menşeisini en açık gösteren demleme ailesidir. Etiyopya ve Orta Amerika lotlarında çiçek, citrus ve çay benzeri gövde; daha dolgun lotlarda kakao ve kuru meyve öne çıkar.</p>
<p>İzmir’den kargolanan taze kavrumu 1:15–1:17 su oranıyla denemeye başlayın. Öğütümü yöntemine göre ayarlamak için sipariş notu bırakabilirsiniz.</p>`,
  },
  {
    slug: 'espresso',
    seoTitle: 'Espresso Çekirdeği | Taze Kavrulmuş Specialty Kahve',
    seoDescription:
      'Espresso ve moka pot için taze kavrulmuş çekirdek kahve. İzmir Ayrancılar kavurma atölyesinden online sipariş.',
    description: `<p>Espresso çekirdeklerimiz, 25–30 saniyelik shot’ta tatlılık ve gövdeyi dengelemek için geliştirilir. Ev tipi makine, lever veya moka pot için çekirdek ya da espresso inceliği öğütüm seçebilirsiniz.</p>
<p>Tek köken espresso daha belirgin meyve ve asidite verir; blend’ler ise sütlü içeceklerde daha yuvarlak durur. Taze kavrum, crema ve şeker hissini rafta bekleyen kahveye göre belirgin yükseltir.</p>
<p>Başlangıç oranı 1:2 (ör. 18 g kahve / 36 g espresso). Öğütümü shot süresine göre ince ayarlayın; çok hızlı akışta öğütümü inceltin.</p>`,
  },
];

const POSTS: BlogSeed[] = [
  {
    slug: 'cekirdek-kahve-nedir',
    title: 'Çekirdek Kahve Nedir?',
    excerpt:
      'Çekirdek kahve, kavrulmuş kahve meyvesinin tohumudur; öğütülmeden saklandığında aroma daha uzun kalır.',
    content: `<p>Çekirdek kahve, kahve kirazının içindeki tohumun kavrulmuş halidir. Market raflarındaki hazır öğütülmüş paketlerin aksine, çekirdek evde veya atölyede demlemeden hemen önce öğütülür.</p>
<h2>Neden çekirdek alınır?</h2>
<p>Öğütülmüş kahvenin yüzeyi çok geniştir; oksijen, nem ve ışık aromayı hızla bozar. Çekirdek halinde saklamak, özellikle taze kavrulmuş specialty kahvede farkı korur.</p>
<h2>Çekirdek kahve ile öğütülmüş kahve</h2>
<p>Değirmeniniz varsa çekirdek alın. Yoksa siparişte öğütülmüş seçeneğini kullanın; biz demleme yöntemine göre inceliği ayarlarız. Türk kahvesi un kıvamı, espresso ince, filtre orta kaba ister.</p>
<p>Kılıç Coffee Roaster, İzmir Torbalı Ayrancılar’da çekirdekleri siparişe yakın kavurur. Kataloğumuzda Türk kahvesi, filtre ve espresso için ayrı kategoriler bulunur.</p>`,
    coverKey: 'product-1',
    tags: ['çekirdek kahve', 'rehber'],
    seoTitle: 'Çekirdek Kahve Nedir? | Taze Kavrum Rehberi',
    seoDescription:
      'Çekirdek kahve nedir, neden öğütülmüşten daha taze kalır ve İzmir’den nasıl sipariş edilir?',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['filtre-kahve', 'espresso', 'turk-kahvesi'],
  },
  {
    slug: 'specialty-coffee-nedir',
    title: 'Specialty Coffee Nedir?',
    excerpt:
      'Specialty coffee, izlenebilir menşei, özenli işlem ve kavrumla yüksek puanlı lotları ifade eder.',
    content: `<p>Specialty coffee (özel kahve), kusuru düşük, menşei belli, işlem ve kavrumu şeffaf lotlardır. Amaç “kahve tadında acı içecek” değil; menşeye özgü aroma, asidite ve tatlılığı fincana taşımaktır.</p>
<h2>Specialty kahve nasıl anlaşılır?</h2>
<ul>
<li>Ülke, bölge, işlem (yıkama, natural, honey) ve çeşit bilgisi vardır.</li>
<li>Kavrum tarihi veya taze kavrum iddiası somuttur.</li>
<li>Tadım notları pazarlama sloganı değil, fincanda aranabilir izlerdir.</li>
</ul>
<h2>İzmir’de specialty kahve</h2>
<p>Ayrancılar / Torbalı atölyemizde küçük batch kavuruyoruz. Filtre profillerinde berraklık, espresso ve Türk kahvesinde gövde ve tatlılık öne çıkar. Lotlar değiştikçe katalogdaki menşei ve nota bilgilerini güncelleriz.</p>
<p>Specialty kahve pahalı görünmesin diye değil, çekirdeğin emeğini korumak için yavaş kavrulur. Online sipariş veya atölye ziyaretiyle taze kavrum alabilirsiniz.</p>`,
    coverKey: 'ethos',
    tags: ['specialty coffee', 'rehber'],
    seoTitle: 'Specialty Coffee Nedir? | Özel Kahve Rehberi',
    seoDescription:
      'Specialty coffee ne demek, nasıl seçilir ve İzmir Torbalı’da taze kavrulmuş specialty kahve nereden alınır?',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['filtre-kahve', 'espresso'],
  },
  {
    slug: 'v60-nasil-yapilir',
    title: 'V60 Nasıl Yapılır?',
    excerpt:
      'V60, filtre kahvede berrak fincan için döküş ve öğütüm kontrolü ister. Basit bir başlangıç tarifi.',
    content: `<p>Hario V60, konik filtre ile suyun çekirdekle temasını yönettiğiniz bir demleme yöntemidir. Taze kavrulmuş filtre kahve çekirdeği, doğru öğütüm ve 92–96°C su yeter.</p>
<h2>Başlangıç tarifi</h2>
<p><strong>15 g kahve / 250 g su</strong> (yaklaşık 1:16,7). Öğütüm orta-kaba, damla kahve ile French Press arası. Filtreyi durulayın, kahveyi koyun, 30–45 saniye bloom (40 g su), ardından dairesel döküşle 2:30–3:00 dakikada bitirin.</p>
<h2>Hatalar</h2>
<p>Çok ince öğütüm acı ve tıkanma yapar; çok kaba öğütüm sulu ve ekşi bırakır. Su çok sıcak ve uzun demleme de yakar. Çekirdek bayatsa hiçbir tarif kurtarmaz.</p>
<p>Kılıç Coffee Roaster filtre kahve kategorisindeki kavrumlar V60 için uygundur. Öğütülmüş istiyorsanız siparişte V60 notu bırakın.</p>`,
    coverKey: 'product-2',
    tags: ['v60', 'filtre kahve', 'demleme'],
    seoTitle: 'V60 Nasıl Yapılır? | Filtre Kahve Rehberi',
    seoDescription:
      'V60 demleme oranı, öğütüm ve döküş: evde berrak filtre kahve için adım adım rehber.',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['filtre-kahve'],
  },
  {
    slug: 'french-press-nasil-yapilir',
    title: 'French Press Nasıl Yapılır?',
    excerpt:
      'French Press, kaba öğütüm ve 4 dakikalık demleme ile dolgun gövdeli filtre kahve verir.',
    content: `<p>French Press (pres pot), metal süzgeçli immersiyon demlemedir. Kağıt filtre olmadığı için yağlar fincanda kalır; gövde daha dolgun olur.</p>
<h2>Oran ve süre</h2>
<p>30 g kaba öğütülmüş kahve / 500 ml 93°C su. Kahveyi koyun, suyu ekleyin, karıştırın, kapağı kapatın. 4 dakikada pistonu yavaş itin. Daha ince öğütüm tortu ve acılık artırır.</p>
<h2>Hangi çekirdek?</h2>
<p>Orta kavrum filtre kahveler French Press’te çikolata ve kuru meyve verir. Çok açık kavrum asiditeyi yükseltir; çok koyu kavrum acılaşır.</p>
<p>Taze kavrulmuş çekirdeği kaba öğütün. Öğütülmüş siparişte “French Press” yazmanız yeterli. İzmir’den kargolanan paketleri açtıktan sonra hava almayan kapta saklayın.</p>`,
    coverKey: 'product-3',
    tags: ['french press', 'filtre kahve', 'demleme'],
    seoTitle: 'French Press Nasıl Yapılır? | Oran ve Süre',
    seoDescription:
      'French Press kahve tarifi: gramaj, öğütüm, 4 dakika demleme ve hangi çekirdeğin uyduğu.',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['filtre-kahve'],
  },
  {
    slug: 'espresso-nasil-yapilir',
    title: 'Espresso Nasıl Yapılır?',
    excerpt:
      'Espresso, ince öğütüm, 9 bar civarı basınç ve 25–30 saniyelik ekstraksiyonla kısa, yoğun kahvedir.',
    content: `<p>Espresso, taze kavrulmuş çekirdeğin ince öğütülüp yüksek basınçla kısa sürede çekilmesidir. Ev makinesinde tutarlılık; doz, öğütüm ve süre üçlüsüne bağlıdır.</p>
<h2>Başlangıç noktası</h2>
<p>18 g kahve, 36 g çıkış (1:2), 25–30 saniye. Çok hızlı akışta öğütümü inceltin; çok yavaş ve acıda kabalaştırın. Çekirdek taze olmalı — kavrumdan 3–21 gün arası genellikle en dengeli penceredir.</p>
<h2>Espresso için hangi çekirdek?</h2>
<p>Gövdeli, tatlı, orta kavrum lotlar sütlü içeceklerde daha bağışlayıcıdır. Tek köken açık kavrumlar shot’ta daha asidik durur. Kataloğumuzdaki espresso kategorisi bu denge için seçilir.</p>
<p>Öğütülmüş espresso hızlı bayatlar; mümkünse çekirdek alın. Makineniz yoksa moka pot benzer yoğunluk verir.</p>`,
    coverKey: 'product-4',
    tags: ['espresso', 'demleme'],
    seoTitle: 'Espresso Nasıl Yapılır? | Ev Makinesi Rehberi',
    seoDescription:
      'Evde espresso: 1:2 oran, öğütüm ayarı, süre ve taze kavrulmuş espresso çekirdeği seçimi.',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['espresso'],
  },
  {
    slug: 'moka-pot-nasil-kullanilir',
    title: 'Moka Pot Nasıl Kullanılır?',
    excerpt:
      'Moka pot, ocağa konan alüminyum cezve ile espresso’ya yakın yoğun kahve üretir.',
    content: `<p>Moka pot (Bialetti tipi), alt haznedeki suyun buhar basıncıyla kahve yatağından geçtiği bir demleme aracıdır. Espresso kadar yoğun değil ama filtre kahveden belirgin daha güçlüdür.</p>
<h2>Kullanım</h2>
<ol>
<li>Alt hazneyi emniyet valfine kadar su doldurun (kaynar su daha az yanık tat verir).</li>
<li>Sepeti tepeleme bastırmadan, espresso-filtre arası öğütümle doldurun.</li>
<li>Orta ateşte, kahve aktıktan sonra ocaktan alın; son damlalar acılaşır.</li>
</ol>
<h2>Hangi kahve?</h2>
<p>Espresso veya orta-koyu filtre kavrumları moka potta iyi durur. Çok açık specialty lotlar ekşi kalabilir. Taze kavrulmuş çekirdeği moka inceliğinde öğütün veya siparişte belirtin.</p>
<p>Kılıç Coffee Roaster espresso çekirdekleri moka pot için de uygundur. İzmir’den kargo ile gelir; atölyeden de alabilirsiniz.</p>`,
    coverKey: 'product-5',
    tags: ['moka pot', 'espresso', 'demleme'],
    seoTitle: 'Moka Pot Nasıl Kullanılır? | Adım Adım',
    seoDescription:
      'Moka pot kahve yapımı: su, öğütüm, ateş kontrolü ve hangi çekirdeğin uyduğu.',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['espresso'],
  },
  {
    slug: 'kahve-kavurma-dereceleri',
    title: 'Kahve Kavurma Dereceleri Nelerdir?',
    excerpt:
      'Açık, orta ve koyu kavrum; asidite, tatlılık ve gövde dengesini değiştirir. Hangisi neye uyar?',
    content: `<p>Kavurma derecesi, çekirdeğin aldığı ısı ve gelişim süresidir. Aynı yeşil kahve açık kavrulunca daha asidik ve çaysı; koyu kavrulunca daha acı, dumanlı ve düşük asiditeli olur.</p>
<h2>Açık kavrum</h2>
<p>Filtre kahvede menşei (Etiyopya çiçeği, Kenya citrus) daha okunur. Espresso’da zorlayıcı olabilir; ev makinesinde ekşi shot riski vardır.</p>
<h2>Orta kavrum</h2>
<p>Tatlılık, gövde ve asidite ortası. Filtre, espresso ve birçok Türk kahvesi profili buradadır. Günlük içim için en bağışlayıcı aralıktır.</p>
<h2>Koyu kavrum</h2>
<p>Kakao, kavrulmuş fındık, düşük asidite. Fazlası kömür ve acılık getirir. Klasik cezve sevenler orta-koyu hattı tercih eder.</p>
<p>Kılıç Coffee Roaster’da her ürünün kavrum derecesi ürün sayfasında yazılıdır. “Açık mı koyu mu?” sorusunun cevabı demleme yönteminize bağlıdır.</p>`,
    coverKey: 'og',
    tags: ['kavrum', 'rehber'],
    seoTitle: 'Kahve Kavurma Dereceleri | Açık Orta Koyu',
    seoDescription:
      'Açık, orta ve koyu kavrum ne fark eder? Filtre, espresso ve Türk kahvesi için hangi derece?',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['filtre-kahve', 'espresso', 'turk-kahvesi'],
  },
  {
    slug: 'izmirde-taze-kavrulmus-kahve',
    title: 'İzmir’de Taze Kavrulmuş Kahve Nereden Alınır?',
    excerpt:
      'İzmir’de specialty çekirdek arıyorsanız kavurma tarihi ve atölye şeffaflığına bakın. Torbalı Ayrancılar’dan kargo da var.',
    content: `<p>İzmir’de çekirdek kahve almak isteyenler genellikle Alsancak ve Karşıyaka’daki kafeleri düşünür. Taze kavrulmuş kahve ise asıl olarak kavurucunun batch tarihine bağlıdır — vitrindeki güzel paket yetmez.</p>
<h2>Nelere bakmalı?</h2>
<ul>
<li>Kavurma tarihi veya “siparişe göre kavrum” açıklaması</li>
<li>Menşei, işlem, kavrum derecesi</li>
<li>Öğütüm seçeneği (Türk kahvesi / espresso / filtre)</li>
</ul>
<h2>Torbalı / Ayrancılar</h2>
<p>Kılıç Coffee Roaster atölyesi Ayrancılar, Torbalı’dadır. Online sipariş Türkiye’ye kargolanır; randevuyla atölyeden de alabilirsiniz. Espresso, filtre ve Türk kahvesi çekirdekleri ayrı kategorilerde listelenir.</p>
<p>İzmir specialty coffee arıyorsanız hem tadım hem kavrum kaydı olan küçük atölyeler daha tutarlı sonuç verir. Büyük market zincirinin “çekirdek” reyonu çoğu zaman aylar önce kavrulmuştur.</p>`,
    coverKey: 'workshop',
    tags: ['izmir', 'taze kavrulmuş kahve', 'yerel'],
    seoTitle: 'İzmir’de Taze Kavrulmuş Kahve | Specialty Coffee',
    seoDescription:
      'İzmir’de taze kavrulmuş çekirdek kahve nereden alınır? Torbalı Ayrancılar kavurma atölyesi ve online sipariş.',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['turk-kahvesi', 'filtre-kahve', 'espresso'],
  },
  {
    slug: 'torbali-ayrancilar-kahve',
    title: 'Torbalı ve Ayrancılar’da Kahve',
    excerpt:
      'Ayrancılar’daki kavurma atölyemiz İzmir’in doğusunda taze specialty çekirdek üretir. Ziyaret ve kargo mümkün.',
    content: `<p>Torbalı ve Ayrancılar, İzmir merkeze göre daha sakin bir sanayi ve tarım kuşağındadır. Kahve kavurma atölyemiz burada: adresimiz Ayrancılar Mahallesi Değirmen Cad. No:55A.</p>
<h2>Neden burada kavuruyoruz?</h2>
<p>Küçük batch, gürültülü bir cadde kafesi değil üretim hattı ister. Torbalı’daki atölye; drum kavurma, dinlendirme ve paketlemeyi aynı çatı altında tutar. İzmir’in her yerine ve Türkiye’ye kargo çıkar.</p>
<h2>Ziyaret</h2>
<p>Atölyeyi görmek için iletişim formu veya telefonla randevu alın. Çalışma saatleri sitede güncel tutulur. Yerinde çekirdek kahve, Türk kahvesi ve espresso kavrumları alabilirsiniz.</p>
<p>Torbalı kahve veya Ayrancılar kahveci arayanlar için bu sayfa bir kafe listesi değil; taze kavrulmuş specialty çekirdek kaynağıdır. Google’da yorum bırakmak isterseniz işletme profilimizdeki bağlantıyı kullanın.</p>`,
    coverKey: 'workshop',
    tags: ['torbalı', 'ayrancılar', 'izmir', 'yerel'],
    seoTitle: 'Torbalı Ayrancılar Kahve | Kavurma Atölyesi',
    seoDescription:
      'Torbalı ve Ayrancılar’da kahve: Kılıç Coffee Roaster atölye adresi, ziyaret ve taze kavrulmuş çekirdek.',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['turk-kahvesi', 'filtre-kahve', 'espresso'],
  },
  {
    slug: 'espresso-icin-hangi-cekirdek',
    title: 'Espresso İçin Hangi Kahve Çekirdeği Kullanılır?',
    excerpt:
      'Espresso çekirdeği ayrı bir botanik tür değildir; kavrum ve işleme shot’a göre seçilir.',
    content: `<p>“Espresso çekirdeği” market dilidir. Botanikte espresso diye bir çeşidi yoktur; shot’a uygun kavrulmuş Arabica (bazen Robusta karışımı) kullanılır.</p>
<h2>Nelere bakılır?</h2>
<ul>
<li><strong>Kavrum:</strong> Orta, orta-koyu — açık kavrum ev makinesinde ekşi kalabilir.</li>
<li><strong>Gövde:</strong> Sütlü içecekler için daha dolgun lotlar.</li>
<li><strong>Tazelik:</strong> Kavrumdan sonraki birkaç gün gaz çıkar; 1–3. hafta genelde en iyi penceredir.</li>
</ul>
<h2>Tek köken mi blend mi?</h2>
<p>Tek köken espresso karakterlidir (meyve, çiçek). Blend’ler gün gün daha öngörülebilirdir. Kılıç Coffee Roaster espresso kategorisindeki kavrumlar ev ve moka pot için seçilir.</p>
<p>Öğütümü makinenize göre ayarlayın; hazır öğütülmüş “espresso” poşeti çoğu değirmende sizin sepetinize uymaz. Çekirdek alıp taze öğütmek daha doğru sonuç verir.</p>`,
    coverKey: 'product-1',
    tags: ['espresso', 'çekirdek kahve'],
    seoTitle: 'Espresso İçin Hangi Çekirdek? | Seçim Rehberi',
    seoDescription:
      'Espresso çekirdeği nasıl seçilir? Kavrum, gövde, tazelik ve tek köken / blend farkı.',
    relatedProductSlugs: [],
    relatedCategorySlugs: ['espresso'],
  },
];

/**
 * Ürün SEO alanları, kategori intro, ana sayfa TR H2, geo, blog köşe yazıları.
 */
export class SeoCatalogLocalContent1797000000000 implements MigrationInterface {
  name = 'SeoCatalogLocalContent1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "roasted_at" date NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "brew_guide" jsonb NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "storage_notes" text NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD COLUMN IF NOT EXISTS "related_category_slugs" text[] NOT NULL DEFAULT '{}'
    `);

    for (const cat of CATEGORIES) {
      await queryRunner.query(
        `
        UPDATE "categories"
        SET
          "seo_title" = COALESCE(NULLIF("seo_title", ''), $2),
          "seo_description" = COALESCE(NULLIF("seo_description", ''), $3),
          "description" = CASE
            WHEN "description" IS NULL OR length(trim("description")) < 80 THEN $4
            ELSE "description"
          END,
          "updated_at" = now()
        WHERE "slug" = $1
        `,
        [cat.slug, cat.seoTitle, cat.seoDescription, cat.description],
      );
    }

    await queryRunner.query(
      `
      UPDATE site_settings
      SET value = value || jsonb_build_object(
            'title', $1::text,
            'description', $2::text
          ),
          updated_at = now()
      WHERE key = 'seo'
        AND COALESCE(value->>'title', '') IN (
          'Kılıç Coffee Roaster | Ayrancılar, Torbalı İzmir',
          'Kılıç Coffee Roaster',
          ''
        )
      `,
      [
        'Kılıç Coffee Roaster | Taze Kavrulmuş Specialty Kahve | İzmir',
        'İzmir Ayrancılar’da taze kavrulan specialty kahveler. Espresso, filtre ve Türk kahvesi çekirdeklerini keşfedin. Kılıç Coffee Roaster’dan online sipariş verin.',
      ],
    );

    await queryRunner.query(
      `
      UPDATE site_settings
      SET value = value
            || CASE WHEN COALESCE(value->>'latitude', '') = '' THEN jsonb_build_object('latitude', $1::text) ELSE '{}'::jsonb END
            || CASE WHEN COALESCE(value->>'longitude', '') = '' THEN jsonb_build_object('longitude', $2::text) ELSE '{}'::jsonb END,
          updated_at = now()
      WHERE key = 'contact'
      `,
      ['38.3015', '27.3583'],
    );

    await queryRunner.query(
      `
      UPDATE content_sections
      SET content = content || $1::jsonb,
          updated_at = now()
      WHERE page = 'home' AND section_key = 'ethos'
      `,
      [
        JSON.stringify({
          titleLines: ['Taze kavrulmuş', 'specialty kahve'],
          description:
            'İzmir Torbalı Ayrancılar’da batch bazlı kavuruyoruz. Her çekirdek için termal eğri, hava ve gelişim süresini izleriz; fincanda tekrarlanabilir bir profil hedefleriz.',
        }),
      ],
    );

    await queryRunner.query(
      `
      UPDATE content_sections
      SET content = content || $1::jsonb,
          updated_at = now()
      WHERE page = 'home' AND section_key = 'products'
      `,
      [
        JSON.stringify({
          title: 'Espresso, filtre ve Türk kahvesi',
          subtitle: 'Taze kavrulmuş specialty çekirdekler',
        }),
      ],
    );

    await queryRunner.query(
      `
      UPDATE content_sections
      SET content = content || $1::jsonb,
          updated_at = now()
      WHERE page = 'home' AND section_key = 'workshop'
      `,
      [
        JSON.stringify({
          subtitle: 'Ayrancılar · Torbalı · İzmir',
          titleLines: ['Atölyeyi', 'ziyaret edin'],
          description:
            'Torbalı Ayrancılar’daki kahve kavurma atölyemizde tadım ve taze kavrum bir arada. Randevuyla ziyaret edebilir, çekirdek kahveyi yerinden alabilirsiniz.',
        }),
      ],
    );

    await queryRunner.query(`
      UPDATE "blog_posts"
      SET
        "related_category_slugs" = ARRAY['turk-kahvesi']::text[],
        "updated_at" = now()
      WHERE "slug" IN (
        'turk-kahvesi-nasil-demlenir',
        'turk-kahvesi-ogutme-inceligi',
        'turk-kahvesi-saklama-taze-kavrum',
        'turk-kahvesi-secim-rehberi'
      )
      AND cardinality("related_category_slugs") = 0
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
          ${sqlTextArray(post.relatedProductSlugs)},
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
    }

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
      ) sub
      WHERE cardinality(bp.related_product_slugs) = 0
        AND cardinality(sub.slugs) > 0
        AND sub.cat_slug = bp.related_category_slugs[1]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = POSTS.map((p) => sqlString(p.slug)).join(', ');
    await queryRunner.query(`
      DELETE FROM "blog_posts" WHERE "slug" IN (${slugs})
    `);
    await queryRunner.query(`
      ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "related_category_slugs"
    `);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "storage_notes"
    `);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "brew_guide"
    `);
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "roasted_at"
    `);
  }
}
