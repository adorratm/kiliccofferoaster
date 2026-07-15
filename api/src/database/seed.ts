import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { AppDataSource } from '@database/data-source';
import { AdminAllowlist } from '@entities/admin-allowlist.entity';
import { Category } from '@entities/category.entity';
import { Product } from '@entities/product.entity';
import { LegalDocument } from '@entities/legal-document.entity';
import { ShippingProviderConfig } from '@entities/shipping-provider-config.entity';
import { ShippingProviderCode } from '@entities/shipment.entity';
import { SiteSetting } from '@entities/site-setting.entity';
import { ContentSection } from '@entities/content-section.entity';
import {
  DEFAULT_HOME_SECTIONS,
  DEFAULT_SITE_SETTINGS,
} from '@database/cms-defaults';

config({ path: join(process.cwd(), '..', '.env') });
config();

async function seed() {
  await AppDataSource.initialize();
  const em = AppDataSource.manager;

  const adminEmail = (
    process.env.ADMIN_ALLOWLIST || 'emrekilic19983@gmail.com'
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

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

  let singleOrigin = await em.findOne(Category, {
    where: { slug: 'single-origin' },
  });
  if (!singleOrigin) {
    singleOrigin = em.create(Category, {
      slug: 'single-origin',
      name: 'Single Origin',
      description: 'Tek ülke / bölge kahveleri',
      sortOrder: 1,
      isActive: true,
    });
    await em.save(singleOrigin);
  }

  let blends = await em.findOne(Category, { where: { slug: 'blends' } });
  if (!blends) {
    blends = em.create(Category, {
      slug: 'blends',
      name: 'Harmanlar',
      description: 'Özenle harmanlanmış kavrulmuş kahveler',
      sortOrder: 2,
      isActive: true,
    });
    await em.save(blends);
  }

  const products = [
    {
      slug: 'ethiopia-yirgacheffe',
      name: 'Ethiopia Yirgacheffe',
      description:
        'Çiçeksi aromalar, bergamot ve jasmine notalarıyla bilinen Etiyopya Yirgacheffe.',
      shortDescription: 'Çiçeksi, bergamot, jasmine',
      originCountry: 'Ethiopia',
      originRegion: 'Yirgacheffe',
      altitude: '1800-2200m',
      process: 'Washed',
      varietal: 'Heirloom',
      roastLevel: 'Light',
      flavorNotes: ['jasmine', 'bergamot', 'peach'],
      basePrice: '450.00',
      stock: 100,
      isFeatured: true,
      badge: 'Yeni Hasat',
      categoryId: singleOrigin.id,
    },
    {
      slug: 'colombia-huila',
      name: 'Colombia Huila',
      description:
        'Karamel tatlılığı ve dengeli asiditeye sahip Kolombiya Huila.',
      shortDescription: 'Karamel, fındık, kırmızı elma',
      originCountry: 'Colombia',
      originRegion: 'Huila',
      altitude: '1600-1900m',
      process: 'Washed',
      varietal: 'Caturra, Castillo',
      roastLevel: 'Medium',
      flavorNotes: ['caramel', 'hazelnut', 'red apple'],
      basePrice: '420.00',
      stock: 120,
      isFeatured: true,
      badge: null,
      categoryId: singleOrigin.id,
    },
    {
      slug: 'brazil-cerrado',
      name: 'Brazil Cerrado',
      description:
        'Çikolata ve fındık profiliyle espresso ve filtreye uygun Brezilya Cerrado.',
      shortDescription: 'Çikolata, fındık, kakao',
      originCountry: 'Brazil',
      originRegion: 'Cerrado',
      altitude: '900-1200m',
      process: 'Natural',
      varietal: 'Bourbon, Catuaí',
      roastLevel: 'Medium-Dark',
      flavorNotes: ['chocolate', 'nut', 'cocoa'],
      basePrice: '380.00',
      stock: 150,
      isFeatured: false,
      badge: 'Espresso',
      categoryId: blends.id,
    },
  ];

  for (const p of products) {
    const exists = await em.findOne(Product, { where: { slug: p.slug } });
    if (!exists) {
      await em.save(em.create(Product, { ...p, currency: 'TRY', isActive: true, gallery: [] }));
      console.log('Product:', p.slug);
    }
  }

  const legalDocs = [
    { slug: 'kvkk', title: 'KVKK Aydınlatma' },
    { slug: 'cerez-politikasi', title: 'Çerez Politikası' },
    { slug: 'mesafeli-satis', title: 'Mesafeli Satış Sözleşmesi' },
    { slug: 'on-bilgilendirme', title: 'Ön Bilgilendirme Formu' },
    { slug: 'iptal-iade', title: 'İptal ve İade Koşulları' },
    { slug: 'aydinlatma-metni', title: 'Aydınlatma Metni' },
    { slug: 'gizlilik', title: 'Gizlilik Politikası' },
  ];

  for (const doc of legalDocs) {
    const exists = await em.findOne(LegalDocument, {
      where: { slug: doc.slug, version: '1.0' },
    });
    if (!exists) {
      await em.save(
        em.create(LegalDocument, {
          slug: doc.slug,
          title: doc.title,
          content: `<p>${doc.title} — örnek içerik (seed).</p>`,
          version: '1.0',
          isPublished: true,
          publishedAt: new Date(),
          locale: 'tr',
        }),
      );
      console.log('Legal:', doc.slug);
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
