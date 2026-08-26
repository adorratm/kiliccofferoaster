import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { AppDataSource } from '@database/data-source';
import { AdminAllowlist } from '@entities/admin-allowlist.entity';
import { User, UserRole, AuthProvider } from '@entities/user.entity';
import { CashAccount, CashAccountKind } from '@entities/cash-account.entity';
import { AccountingSettings } from '@entities/accounting-settings.entity';
import * as bcrypt from 'bcryptjs';
import { Category } from '@entities/category.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import { LegalDocument } from '@entities/legal-document.entity';
import { BlogPost } from '@entities/blog-post.entity';
import { Coupon, CouponType } from '@entities/coupon.entity';
import { ShippingProviderConfig } from '@entities/shipping-provider-config.entity';
import { ShippingProviderCode } from '@entities/shipment.entity';
import { SiteSetting } from '@entities/site-setting.entity';
import { ContentSection } from '@entities/content-section.entity';
import {
  DEFAULT_HOME_SECTIONS,
  DEFAULT_SITE_SETTINGS,
} from '@database/cms-defaults';
import { LEGAL_DEFAULTS } from '@database/legal-defaults';
import { apiStockImage } from '../common/stock-images';

config({ path: join(process.cwd(), '..', '.env') });
config();

async function seed() {
  await AppDataSource.initialize();
  const em = AppDataSource.manager;

  const adminEmail = (process.env.ADMIN_ALLOWLIST || '')
    .split(',')[0]
    .trim()
    .toLowerCase();

  if (adminEmail) {
    let allow = await em.findOne(AdminAllowlist, {
      where: { email: adminEmail },
    });
    if (!allow) {
      allow = em.create(AdminAllowlist, {
        email: adminEmail,
        active: true,
        note: 'Seed admin',
      });
      await em.save(allow);
      console.log('Admin allowlist:', adminEmail);
    }
  } else {
    console.log('ADMIN_ALLOWLIST boş — admin allowlist seed atlandı');
  }

  // Ön muhasebe kategorileri
  const extraCategories = [
    { slug: 'turk-kahvesi', name: 'Türk Kahvesi', description: 'Geleneksel Türk kahvesi', sortOrder: 1 },
    { slug: 'filtre-kahve', name: 'Filtre Kahve', description: 'Filtre / pour-over', sortOrder: 2 },
    { slug: 'espresso', name: 'Espresso', description: 'Espresso kavrumları', sortOrder: 3 },
    { slug: 'lokum', name: 'Lokum', description: 'Lokum çeşitleri', sortOrder: 4 },
    { slug: 'draje', name: 'Draje', description: 'Draje çeşitleri', sortOrder: 5 },
    { slug: 'kuruyemis', name: 'Kuruyemiş', description: 'Kuruyemiş', sortOrder: 6 },
    { slug: 'bitki-cayi', name: 'Bitki Çayı', description: 'Bitki çayları', sortOrder: 7 },
    { slug: 'baharat', name: 'Baharat', description: 'Baharat çeşitleri', sortOrder: 8 },
    { slug: 'mesrubat', name: 'Meşrubat', description: 'Meşrubat', sortOrder: 9 },
    { slug: 'cay', name: 'Çay', description: 'Çay', sortOrder: 10 },
  ];
  for (const row of extraCategories) {
    let cat = await em.findOne(Category, { where: { slug: row.slug } });
    if (!cat) {
      cat = em.create(Category, { ...row, isActive: true });
      await em.save(cat);
      console.log('Category:', row.slug);
    } else if (!cat.isActive) {
      cat.isActive = true;
      cat.name = row.name;
      cat.sortOrder = row.sortOrder;
      await em.save(cat);
    }
  }

  let turkCategory = await em.findOne(Category, {
    where: { slug: 'turk-kahvesi' },
  });
  if (!turkCategory) {
    throw new Error('turk-kahvesi kategorisi oluşturulamadı');
  }

  // Eski specialty kategorilerini pasifle
  for (const slug of ['single-origin', 'blends']) {
    const cat = await em.findOne(Category, { where: { slug } });
    if (cat && cat.isActive) {
      cat.isActive = false;
      await em.save(cat);
      console.log('Category deactivated:', slug);
    }
  }

  const turkKahvesiVariants = [
    { sku: 'TK-100', weightLabel: '100gr', price: '100.00', stock: 100 },
    { sku: 'TK-250', weightLabel: '250gr', price: '250.00', stock: 100 },
    { sku: 'TK-500', weightLabel: '500gr', price: '500.00', stock: 80 },
    { sku: 'TK-750', weightLabel: '750gr', price: '750.00', stock: 60 },
    { sku: 'TK-1000', weightLabel: '1kg', price: '1000.00', stock: 50 },
  ];

  let turkKahvesi = await em.findOne(Product, {
    where: { slug: 'turk-kahvesi' },
  });
  if (!turkKahvesi) {
    turkKahvesi = await em.save(
      em.create(Product, {
        slug: 'turk-kahvesi',
        name: 'Türk Kahvesi',
        description:
          'Torbalı’da taze kavrulan geleneksel Türk kahvesi. Çekirdek veya öğütülmüş olarak, istediğiniz gramajda sipariş edin.',
        shortDescription: 'Geleneksel · Taze kavrum · Çekirdek veya öğütülmüş',
        originCountry: 'Türkiye',
        originRegion: 'Torbalı / İzmir',
        altitude: null,
        process: null,
        varietal: null,
        roastLevel: 'Orta-Koyu',
        flavorNotes: ['kakao', 'fındık', 'baharat'],
        basePrice: turkKahvesiVariants[0].price,
        stock: turkKahvesiVariants.reduce((s, v) => s + v.stock, 0),
        currency: 'TRY',
        isActive: true,
        isFeatured: true,
        badge: null,
        gallery: [],
        imageUrl: apiStockImage('product-1'),
        categoryId: turkCategory.id,
        kind: 'coffee_turkish',
        unit: 'g',
        vatRate: '20.00',
      }),
    );
    console.log('Product: turk-kahvesi');
  } else {
    turkKahvesi.name = 'Türk Kahvesi';
    turkKahvesi.isActive = true;
    turkKahvesi.isFeatured = true;
    turkKahvesi.categoryId = turkCategory.id;
    turkKahvesi.kind = 'coffee_turkish';
    turkKahvesi.unit = turkKahvesi.unit || 'g';
    turkKahvesi.vatRate = turkKahvesi.vatRate || '20.00';
    turkKahvesi.basePrice = turkKahvesiVariants[0].price;
    turkKahvesi.shortDescription =
      turkKahvesi.shortDescription ||
      'Geleneksel · Taze kavrum · Çekirdek veya öğütülmüş';
    if (!turkKahvesi.imageUrl) {
      turkKahvesi.imageUrl = apiStockImage('product-1');
    }
    await em.save(turkKahvesi);
    console.log('Product updated: turk-kahvesi');
  }

  const existingVariants = await em.find(ProductVariant, {
    where: { productId: turkKahvesi.id },
  });
  const desiredLabels = new Set(turkKahvesiVariants.map((v) => v.weightLabel));

  for (const desired of turkKahvesiVariants) {
    const match = existingVariants.find(
      (v) =>
        v.weightLabel === desired.weightLabel ||
        v.sku === desired.sku ||
        // Eski etiket uyumu (250g → 250gr)
        v.weightLabel?.replace(/\s/g, '').toLowerCase() ===
          desired.weightLabel.toLowerCase() ||
        v.weightLabel?.replace(/g$/i, 'gr').toLowerCase() ===
          desired.weightLabel.toLowerCase(),
    );
    if (!match) {
      await em.save(
        em.create(ProductVariant, {
          productId: turkKahvesi.id,
          sku: desired.sku,
          weightLabel: desired.weightLabel,
          price: desired.price,
          stock: desired.stock,
          isActive: true,
        }),
      );
      console.log('Variant created:', desired.weightLabel);
    } else {
      match.sku = desired.sku;
      match.weightLabel = desired.weightLabel;
      match.price = desired.price;
      match.isActive = true;
      await em.save(match);
      console.log('Variant updated:', desired.weightLabel, desired.price);
    }
  }

  for (const v of existingVariants) {
    if (!desiredLabels.has(v.weightLabel)) {
      v.isActive = false;
      await em.save(v);
      console.log('Variant deactivated:', v.weightLabel);
    }
  }

  // Diğer tüm ürünleri pasifle — katalogda yalnızca Türk Kahvesi kalsın
  const allProducts = await em.find(Product, {});
  for (const p of allProducts) {
    if (p.slug === 'turk-kahvesi') continue;
    if (p.isActive || p.isFeatured) {
      p.isActive = false;
      p.isFeatured = false;
      await em.save(p);
      console.log('Product deactivated:', p.slug);
    }
    const variants = await em.find(ProductVariant, {
      where: { productId: p.id },
    });
    for (const v of variants) {
      if (v.isActive) {
        v.isActive = false;
        await em.save(v);
      }
    }
  }

  for (const [slug, meta] of Object.entries(LEGAL_DEFAULTS)) {
    const exists = await em.findOne(LegalDocument, {
      where: { slug },
    });
    if (!exists) {
      await em.save(
        em.create(LegalDocument, {
          slug,
          title: meta.title,
          content: meta.content,
          version: '1.0',
          isPublished: true,
          publishedAt: new Date(),
          locale: 'tr',
        }),
      );
      console.log('Legal:', slug);
    } else if (
      !exists.content ||
      exists.content.includes('örnek içerik')
    ) {
      exists.title = meta.title;
      exists.content = meta.content;
      exists.isPublished = true;
      exists.publishedAt = exists.publishedAt || new Date();
      await em.save(exists);
      console.log('Legal updated:', slug);
    }
  }

  const blogPosts: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    authorName: string;
    tags: string[];
    seoTitle: string;
    seoDescription: string;
    relatedProductSlugs: string[];
  }[] = [
    {
      slug: 'birinci-crack-nedir',
      title: 'Birinci Crack Nedir?',
      excerpt:
        'Kavrumda birinci crack anı, tat profilinin yönünü belirleyen kritik bir eşiktir.',
      content: `<p>Birinci crack, çekirdeğin içinde biriken buharın hücre duvarlarını aşmasıyla duyulan fiziksel kırılmadır. Bu an, kavrumun “geliştirme” fazına giriş kapısıdır.</p>
<p>Çok erken drop yapmak asiditeyi canlı bırakır; fazla uzatmak gövdeyi artırırken çiçeksi notaları baskılar. Torbalı’daki kavurularımızda crack zamanlamasını batch bazında log’larız.</p>
<p>Profillerinizi tekrarlanabilir kılmak için crack zamanı, drop sıcaklığı ve airflow değerlerini birlikte okuyun — tek başına süre yetmez.</p>`,
      coverImageUrl: apiStockImage('ethos'),
      authorName: 'Kılıç Coffee Roaster',
      tags: ['kavrum', 'teknik'],
      seoTitle: 'Birinci Crack Nedir? | Kavrum Tekniği',
      seoDescription:
        'Specialty kahvede birinci crack nedir, neden önemlidir ve tat profilini nasıl etkiler?',
      relatedProductSlugs: ['turk-kahvesi'],
    },
    {
      slug: 'filtre-kahve-ogutme-ipuclari',
      title: 'Filtre Kahve İçin Öğütme İpuçları',
      excerpt:
        'Doğru öğütme boyutu, ekstraksiyonu dengeler; ince değil, kararlı olmalı.',
      content: `<p>Filtre demlemede öğütme, sıcaklık ve oran kadar belirleyicidir. Çok ince öğütme acılaştırır; çok kalın öğütme ise ekşi ve zayıf bir fincan üretir.</p>
<p>Önerilen başlangıç: V60 için orta-ince, batch brew için biraz daha kaba. Aynı kahveyi farklı ekipmanlarda kullanırken önce oranları sabitleyin, sonra öğütmeyi ince ayarlayın.</p>
<p>Yirgacheffe gibi light kavrumlarda biraz daha ince giderek floral notaları öne çıkarabilirsiniz; Brazil gibi gövdeli kahvelerde kaba tarafı tercih edin.</p>`,
      coverImageUrl: apiStockImage('blog'),
      authorName: 'Kılıç Coffee Roaster',
      tags: ['demleme', 'filtre'],
      seoTitle: 'Filtre Kahve Öğütme İpuçları',
      seoDescription:
        'Filtre demleme için öğütme boyutu, oran ve ekipman bazlı pratik ayar önerileri.',
      relatedProductSlugs: [],
    },
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
      coverImageUrl: apiStockImage('product-1'),
      authorName: 'Kılıç Coffee Roaster',
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
      coverImageUrl: apiStockImage('product-2'),
      authorName: 'Kılıç Coffee Roaster',
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
      coverImageUrl: apiStockImage('workshop'),
      authorName: 'Kılıç Coffee Roaster',
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
      coverImageUrl: apiStockImage('product-3'),
      authorName: 'Kılıç Coffee Roaster',
      tags: ['türk kahvesi', 'rehber'],
      seoTitle: 'Türk Kahvesi Seçerken Nelere Bakmalı?',
      seoDescription:
        'Türk kahvesi alırken kavrum, tazelik ve gramaj nasıl seçilir? Torbalı kavurucusundan kısa alışveriş rehberi.',
      relatedProductSlugs: ['turk-kahvesi'],
    },
  ];

  for (const post of blogPosts) {
    const exists = await em.findOne(BlogPost, { where: { slug: post.slug } });
    if (!exists) {
      await em.save(
        em.create(BlogPost, {
          ...post,
          isPublished: true,
          publishedAt: new Date(),
          locale: 'tr',
        }),
      );
      console.log('Blog:', post.slug);
    } else {
      let touched = false;
      if (
        !exists.coverImageUrl ||
        exists.coverImageUrl.includes('unsplash.com')
      ) {
        exists.coverImageUrl = post.coverImageUrl;
        touched = true;
      }
      if (
        post.relatedProductSlugs.length > 0 &&
        (!exists.relatedProductSlugs ||
          exists.relatedProductSlugs.length === 0)
      ) {
        exists.relatedProductSlugs = post.relatedProductSlugs;
        touched = true;
      }
      if (touched) {
        await em.save(exists);
        console.log('Blog updated:', post.slug);
      }
    }
  }

  const shippingProviders: {
    provider: ShippingProviderCode;
    displayName: string;
  }[] = [
    { provider: ShippingProviderCode.YURTICI, displayName: 'Yurtiçi Kargo' },
    {
      provider: ShippingProviderCode.KOLAY_GELSIN,
      displayName: 'Kolay Gelsin',
    },
    { provider: ShippingProviderCode.DHL, displayName: 'DHL' },
    { provider: ShippingProviderCode.SURAT, displayName: 'Sürat Kargo' },
    { provider: ShippingProviderCode.PTT, displayName: 'PTT Kargo' },
    { provider: ShippingProviderCode.HEPSIJET, displayName: 'HepsiJet' },
    {
      provider: ShippingProviderCode.TRENDYOL_EXPRESS,
      displayName: 'Trendyol Express',
    },
  ];

  for (const sp of shippingProviders) {
    const exists = await em.findOne(ShippingProviderConfig, {
      where: { provider: sp.provider },
    });
    if (!exists) {
      await em.save(
        em.create(ShippingProviderConfig, {
          provider: sp.provider,
          displayName: sp.displayName,
          isEnabled: true,
          credentials: {},
          settings: { fee: '89.90', estimatedDays: '2-5 gün' },
        }),
      );
      console.log('Shipping provider:', sp.provider);
    }
  }

  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    const exists = await em.findOne(SiteSetting, { where: { key } });
    if (!exists) {
      await em.save(
        em.create(SiteSetting, {
          key,
          value,
          group: key,
          description: `${key} site ayarları`,
        }),
      );
      console.log('Site setting:', key);
    } else if (key === 'navigation') {
      const nav = (exists.value || {}) as {
        header?: { href: string; label: string }[];
        footerNav?: { href: string; label: string }[];
        footerLegal?: { href: string; label: string }[];
      };
      let changed = false;
      if (nav.header && !nav.header.some((l) => l.href === '/blog')) {
        const idx = nav.header.findIndex((l) => l.href === '/urunler');
        nav.header.splice(idx >= 0 ? idx + 1 : nav.header.length, 0, {
          href: '/blog',
          label: 'Blog',
        });
        changed = true;
      }
      if (nav.footerNav && !nav.footerNav.some((l) => l.href === '/blog')) {
        const idx = nav.footerNav.findIndex((l) => l.href === '/urunler');
        nav.footerNav.splice(idx >= 0 ? idx + 1 : nav.footerNav.length, 0, {
          href: '/blog',
          label: 'Blog',
        });
        changed = true;
      }
      for (const list of [nav.header, nav.footerNav]) {
        if (!list) continue;
        for (const link of list) {
          if (link.href === '/takip/ornek') {
            link.href = '/takip';
            changed = true;
          }
        }
      }
      if (nav.footerLegal) {
        const extras = [
          {
            href: '/musteri-memnuniyeti',
            label: 'Müşteri Memnuniyeti',
          },
          { href: '/guvenli-alisveris', label: 'Güvenli Alışveriş' },
        ];
        for (const extra of extras) {
          if (!nav.footerLegal.some((l) => l.href === extra.href)) {
            const idx = nav.footerLegal.findIndex(
              (l) => l.href === '/iptal-iade',
            );
            nav.footerLegal.splice(
              idx >= 0 ? idx + 1 : nav.footerLegal.length,
              0,
              extra,
            );
            changed = true;
          }
        }
        for (const link of nav.footerLegal) {
          if (link.href === '/cerez-politikasi' && link.label === 'Çerez Politikası') {
            link.label = 'Çerez Kullanımı';
            changed = true;
          }
          if (link.href === '/iptal-iade' && link.label.includes('İptal')) {
            link.label = 'İade Politikası';
            changed = true;
          }
        }
      }
      if (changed) {
        exists.value = nav;
        await em.save(exists);
        console.log('Site setting navigation: updated');
      }
    }
  }

  for (const section of DEFAULT_HOME_SECTIONS) {
    const exists = await em.findOne(ContentSection, {
      where: { page: section.page, sectionKey: section.sectionKey },
    });
    if (!exists) {
      await em.save(
        em.create(ContentSection, {
          page: section.page,
          sectionKey: section.sectionKey,
          title: section.title,
          content: section.content,
          sortOrder: section.sortOrder,
          isPublished: true,
        }),
      );
      console.log('Content section:', section.page, section.sectionKey);
    } else {
      const raw = JSON.stringify(exists.content || {});
      if (raw.includes('unsplash.com')) {
        exists.content = {
          ...(exists.content as object),
          ...section.content,
        } as Record<string, unknown>;
        await em.save(exists);
        console.log(
          'Content section unsplash cleared:',
          section.page,
          section.sectionKey,
        );
      }
    }
  }

  const welcomeCoupon = await em.findOne(Coupon, {
    where: { code: 'HOSGELDIN10' },
  });
  if (!welcomeCoupon) {
    await em.save(
      em.create(Coupon, {
        code: 'HOSGELDIN10',
        title: 'Hoş geldin %10',
        type: CouponType.PERCENT,
        value: '10',
        minSubtotal: '0',
        maxUses: null,
        usedCount: 0,
        firstOrderOnly: true,
        startsAt: null,
        endsAt: null,
        isActive: true,
      }),
    );
    console.log('Coupon: HOSGELDIN10');
  }

  const cashDefaults: { name: string; kind: CashAccountKind }[] = [
    { name: 'Nakit Kasa', kind: CashAccountKind.CASH },
    { name: 'Banka', kind: CashAccountKind.BANK },
    { name: 'PayTR', kind: CashAccountKind.PAYTR },
    { name: 'POS / ÖKC Kart', kind: CashAccountKind.POS },
  ];
  for (const row of cashDefaults) {
    const exists = await em.findOne(CashAccount, { where: { kind: row.kind } });
    if (!exists) {
      await em.save(em.create(CashAccount, row));
      console.log('Cash account:', row.name);
    }
  }

  const settings = await em.findOne(AccountingSettings, { where: {} });
  if (!settings) {
    await em.save(
      em.create(AccountingSettings, {
        companyTitle: 'Kılıç Coffee Roaster',
        city: 'Torbalı / İzmir',
      }),
    );
    console.log('Accounting settings');
  }

  const staffEmail = (process.env.OPS_STAFF_EMAIL || '').trim().toLowerCase();
  const staffPassword = process.env.OPS_STAFF_PASSWORD || '';
  if (staffEmail && staffPassword) {
    let staff = await em.findOne(User, { where: { email: staffEmail } });
    if (!staff) {
      staff = em.create(User, {
        email: staffEmail,
        passwordHash: await bcrypt.hash(staffPassword, 12),
        firstName: 'Ops',
        lastName: 'Staff',
        provider: AuthProvider.LOCAL,
        role: UserRole.STAFF,
        emailVerified: true,
        isActive: true,
      });
      await em.save(staff);
      console.log('Ops staff:', staffEmail);
    }
  }

  console.log('Seed tamamlandı.');
  await AppDataSource.destroy();
}

seed().catch(async (err) => {
  console.error(err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
