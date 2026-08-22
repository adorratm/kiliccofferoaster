import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Product } from '@entities/product.entity';
import { Order } from '@entities/order.entity';
import { Category } from '@entities/category.entity';
import { ContactMessage } from '@entities/contact-message.entity';
import { MediaAsset } from '@entities/media-asset.entity';
import { NewsletterSubscriber } from '@entities/newsletter-subscriber.entity';
import { LegalDocument } from '@entities/legal-document.entity';
import { BlogPost } from '@entities/blog-post.entity';
import { Party } from '@entities/party.entity';
import { Invoice } from '@entities/invoice.entity';
import { Coupon } from '@entities/coupon.entity';
import { Campaign } from '@entities/campaign.entity';
import { User, UserRole } from '@entities/user.entity';
import { ReturnRequest } from '@entities/return-request.entity';
import { ProductReview } from '@entities/product-review.entity';
import { ShippingProviderConfig } from '@entities/shipping-provider-config.entity';
import { MarketplaceAccount } from '@entities/marketplace-account.entity';
import { MarketplaceOrder } from '@entities/marketplace-order.entity';
import { CashAccount } from '@entities/cash-account.entity';
import { OkcSale } from '@entities/okc-sale.entity';

export type SearchHit = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  screen?: string;
};

export type SearchResponse = {
  q: string;
  groups: { type: string; label: string; items: SearchHit[] }[];
};

type PageShortcut = {
  keywords: string[];
  title: string;
  href: string;
  screen?: string;
};

const ADMIN_PAGES: PageShortcut[] = [
  { keywords: ['dashboard', 'özet', 'ozet'], title: 'Dashboard', href: '/' },
  { keywords: ['ürün', 'urun', 'product'], title: 'Ürünler', href: '/urunler' },
  { keywords: ['kategori'], title: 'Kategoriler', href: '/kategoriler' },
  { keywords: ['blog'], title: 'Blog', href: '/blog' },
  { keywords: ['içerik', 'icerik'], title: 'İçerik', href: '/icerik' },
  { keywords: ['site', 'ayar'], title: 'Site Ayarları', href: '/site-ayarlari' },
  { keywords: ['medya'], title: 'Medya', href: '/medya' },
  { keywords: ['sipariş', 'siparis'], title: 'Siparişler', href: '/siparisler' },
  { keywords: ['müşteri', 'musteri'], title: 'Müşteriler', href: '/musteriler' },
  {
    keywords: ['personel', 'onay', 'staff', 'talep'],
    title: 'Personel onayları',
    href: '/personel-onaylari',
  },
  { keywords: ['iade', 'iptal'], title: 'İade Talepleri', href: '/iadeler' },
  { keywords: ['kupon'], title: 'Kuponlar', href: '/kuponlar' },
  { keywords: ['kampanya'], title: 'Kampanyalar', href: '/kampanyalar' },
  { keywords: ['yorum'], title: 'Yorumlar', href: '/yorumlar' },
  { keywords: ['kargo', 'shipping'], title: 'Kargo', href: '/kargo' },
  { keywords: ['pazaryeri', 'trendyol', 'hepsiburada', 'n11'], title: 'Pazaryeri', href: '/pazaryeri' },
  { keywords: ['sözleşme', 'sozlesme', 'yasal'], title: 'Sözleşmeler', href: '/sozlesmeler' },
  { keywords: ['mesaj', 'iletişim', 'iletisim'], title: 'Mesajlar', href: '/mesajlar' },
  { keywords: ['bülten', 'bulten'], title: 'Bülten', href: '/bulten' },
  { keywords: ['bildirim'], title: 'Bildirimler', href: '/bildirimler' },
  { keywords: ['kuyruk', 'queue'], title: 'Kuyruklar', href: '/kuyruklar' },
];

const OPS_PAGES: PageShortcut[] = [
  { keywords: ['dashboard', 'özet', 'ozet'], title: 'Dashboard', href: '/', screen: 'Home' },
  { keywords: ['cari', 'party', 'tedarikçi', 'tedarikci'], title: 'Cari', href: '/cari', screen: 'Parties' },
  { keywords: ['fatura', 'invoice'], title: 'Faturalar', href: '/faturalar', screen: 'Invoices' },
  { keywords: ['stok'], title: 'Stok', href: '/stok', screen: 'Products' },
  { keywords: ['kasa', 'banka'], title: 'Kasa / Banka', href: '/kasa', screen: 'Cash' },
  { keywords: ['okc', 'ökc', 'pos'], title: 'ÖKC Import', href: '/okc', screen: 'Cash' },
  { keywords: ['rapor'], title: 'Raporlar', href: '/raporlar', screen: 'Reports' },
  { keywords: ['ürün', 'urun'], title: 'Ürünler', href: '/urunler', screen: 'Products' },
  { keywords: ['kategori'], title: 'Kategoriler', href: '/kategoriler', screen: 'Categories' },
  { keywords: ['sipariş', 'siparis'], title: 'Siparişler', href: '/siparisler', screen: 'ShopOrders' },
  { keywords: ['müşteri', 'musteri'], title: 'Müşteriler', href: '/musteriler', screen: 'Customers' },
  {
    keywords: ['personel', 'onay', 'staff', 'talep'],
    title: 'Personel onayları',
    href: '/personel-onaylari',
    screen: 'Notifications',
  },
  { keywords: ['iade', 'iptal'], title: 'İadeler', href: '/iadeler', screen: 'Returns' },
  { keywords: ['kupon'], title: 'Kuponlar', href: '/kuponlar', screen: 'Coupons' },
  { keywords: ['kampanya'], title: 'Kampanyalar', href: '/kampanyalar', screen: 'Campaigns' },
  { keywords: ['yorum'], title: 'Yorumlar', href: '/yorumlar', screen: 'Reviews' },
  { keywords: ['kargo'], title: 'Kargo', href: '/kargo', screen: 'Shipping' },
  { keywords: ['mesaj'], title: 'Mesajlar', href: '/mesajlar', screen: 'Messages' },
  { keywords: ['bülten', 'bulten'], title: 'Bülten', href: '/bulten', screen: 'Newsletter' },
  { keywords: ['ayar'], title: 'Ayarlar', href: '/ayarlar', screen: 'Home' },
  { keywords: ['bildirim'], title: 'Bildirimler', href: '/bildirimler', screen: 'Notifications' },
];

@Injectable()
export class SearchService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async searchPublic(q: string, limit = 8): Promise<SearchResponse> {
    const term = q.trim();
    if (term.length < 2) {
      return { q: term, groups: [] };
    }
    const like = `%${term}%`;
    const per = Math.min(limit, 12);
    const now = new Date();

    const [products, legal, posts] = await Promise.all([
      this.em
        .createQueryBuilder(Product, 'p')
        .where('p.isActive = :active', { active: true })
        .andWhere(
          `(p.name ILIKE :like OR p.slug ILIKE :like OR COALESCE(p.originCountry,'') ILIKE :like OR COALESCE(p.originRegion,'') ILIKE :like OR COALESCE(p.roastLevel,'') ILIKE :like OR COALESCE(p.batchId,'') ILIKE :like)`,
          { like },
        )
        .andWhere(
          `EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true)`,
        )
        .orderBy('p.name', 'ASC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(LegalDocument, 'd')
        .where('d.isPublished = :published', { published: true })
        .andWhere(`(d.title ILIKE :like OR d.slug ILIKE :like)`, { like })
        .take(Math.min(per, 5))
        .getMany(),
      this.em
        .createQueryBuilder(BlogPost, 'b')
        .where('b.isPublished = :published', { published: true })
        .andWhere('(b.publishedAt IS NULL OR b.publishedAt <= :now)', { now })
        .andWhere(
          `(b.title ILIKE :like OR b.slug ILIKE :like OR COALESCE(b.excerpt,'') ILIKE :like OR COALESCE(b.authorName,'') ILIKE :like)`,
          { like },
        )
        .orderBy('b.publishedAt', 'DESC')
        .take(per)
        .getMany(),
    ]);

    const groups: SearchResponse['groups'] = [];

    if (products.length) {
      groups.push({
        type: 'products',
        label: 'Ürünler',
        items: products.map((p) => ({
          type: 'product',
          id: p.id,
          title: p.name,
          subtitle: [p.originCountry, p.roastLevel].filter(Boolean).join(' · '),
          href: `/urunler/${p.slug}`,
        })),
      });
    }

    if (legal.length) {
      groups.push({
        type: 'legal',
        label: 'Yasal',
        items: legal.map((d) => ({
          type: 'legal',
          id: d.id,
          title: d.title,
          subtitle: d.slug,
          href: `/${d.slug}`,
        })),
      });
    }

    if (posts.length) {
      groups.push({
        type: 'blog',
        label: 'Blog',
        items: posts.map((p) => ({
          type: 'blog',
          id: p.id,
          title: p.title,
          subtitle: p.excerpt || p.authorName || undefined,
          href: `/blog/${p.slug}`,
        })),
      });
    }

    return { q: term, groups };
  }

  async searchAdmin(q: string, limit = 8): Promise<SearchResponse> {
    const term = q.trim();
    if (term.length < 2) {
      return { q: term, groups: [] };
    }
    const like = `%${term}%`;
    const per = Math.min(limit, 12);

    const [
      products,
      orders,
      categories,
      messages,
      media,
      newsletter,
      legal,
      posts,
      customers,
      coupons,
      campaigns,
      returns,
      reviews,
      shipping,
      marketplaceAccounts,
      marketplaceOrders,
      staffRequests,
    ] = await Promise.all([
      this.em
        .createQueryBuilder(Product, 'p')
        .where(
          `(p.name ILIKE :like OR p.slug ILIKE :like OR COALESCE(p.batchId,'') ILIKE :like)`,
          { like },
        )
        .orderBy('p.updatedAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Order, 'o')
        .where(
          `(o.orderNumber ILIKE :like OR o.customerEmail ILIKE :like OR o.customerName ILIKE :like OR o.customerPhone ILIKE :like)`,
          { like },
        )
        .orderBy('o.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Category, 'c')
        .where(`(c.name ILIKE :like OR c.slug ILIKE :like)`, { like })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ContactMessage, 'm')
        .where(
          `(m.senderName ILIKE :like OR m.senderEmail ILIKE :like OR m.message ILIKE :like OR m.protocolType ILIKE :like)`,
          { like },
        )
        .orderBy('m.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(MediaAsset, 'a')
        .where(
          `(a.filename ILIKE :like OR a.url ILIKE :like OR COALESCE(a.alt,'') ILIKE :like)`,
          { like },
        )
        .orderBy('a.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(NewsletterSubscriber, 'n')
        .where(`n.email ILIKE :like`, { like })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(LegalDocument, 'd')
        .where(`(d.title ILIKE :like OR d.slug ILIKE :like)`, { like })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(BlogPost, 'b')
        .where(
          `(b.title ILIKE :like OR b.slug ILIKE :like OR COALESCE(b.excerpt,'') ILIKE :like)`,
          { like },
        )
        .orderBy('b.updatedAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(User, 'u')
        .where('u.role = :role', { role: UserRole.CUSTOMER })
        .andWhere(
          `(u.email ILIKE :like OR COALESCE(u.firstName,'') ILIKE :like OR COALESCE(u.lastName,'') ILIKE :like OR COALESCE(u.phone,'') ILIKE :like)`,
          { like },
        )
        .orderBy('u.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Coupon, 'cp')
        .where(`(cp.code ILIKE :like OR COALESCE(cp.title,'') ILIKE :like)`, {
          like,
        })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Campaign, 'cm')
        .where(`(cm.name ILIKE :like OR cm.slug ILIKE :like)`, { like })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ReturnRequest, 'r')
        .leftJoinAndSelect('r.order', 'ord')
        .where(
          `(COALESCE(ord.orderNumber,'') ILIKE :like OR r.reason ILIKE :like OR CAST(r.status AS text) ILIKE :like OR CAST(r.type AS text) ILIKE :like)`,
          { like },
        )
        .orderBy('r.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ProductReview, 'rv')
        .leftJoinAndSelect('rv.product', 'prod')
        .where(
          `(rv.authorName ILIKE :like OR COALESCE(rv.title,'') ILIKE :like OR rv.body ILIKE :like OR COALESCE(prod.name,'') ILIKE :like)`,
          { like },
        )
        .orderBy('rv.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ShippingProviderConfig, 'sp')
        .where(
          `(sp.displayName ILIKE :like OR CAST(sp.provider AS text) ILIKE :like)`,
          { like },
        )
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(MarketplaceAccount, 'ma')
        .where(
          `(ma.storeName ILIKE :like OR CAST(ma.platform AS text) ILIKE :like)`,
          { like },
        )
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(MarketplaceOrder, 'mo')
        .leftJoinAndSelect('mo.account', 'acc')
        .where(
          `(mo.externalOrderId ILIKE :like OR COALESCE(mo.externalStatus,'') ILIKE :like OR COALESCE(acc.storeName,'') ILIKE :like)`,
          { like },
        )
        .orderBy('mo.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(User, 'su')
        .where('su.role = :role', { role: UserRole.CUSTOMER })
        .andWhere('su.opsAccessRequestedAt IS NOT NULL')
        .andWhere('su.isActive = true')
        .andWhere(
          `(su.email ILIKE :like OR COALESCE(su.firstName,'') ILIKE :like OR COALESCE(su.lastName,'') ILIKE :like)`,
          { like },
        )
        .orderBy('su.opsAccessRequestedAt', 'ASC')
        .take(per)
        .getMany(),
    ]);

    const groups: SearchResponse['groups'] = [];
    const push = (type: string, label: string, items: SearchHit[]) => {
      if (items.length) groups.push({ type, label, items });
    };

    const pages = this.matchPages(term, ADMIN_PAGES);
    push('pages', 'Sayfalar', pages);

    push(
      'products',
      'Ürünler',
      products.map((p) => ({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: p.slug,
        href: `/urunler?q=${encodeURIComponent(p.name)}`,
      })),
    );
    push(
      'orders',
      'Siparişler',
      orders.map((o) => ({
        type: 'order',
        id: o.id,
        title: o.orderNumber,
        subtitle: `${o.customerName} · ${o.status}`,
        href: `/siparisler/${o.id}`,
      })),
    );
    push(
      'categories',
      'Kategoriler',
      categories.map((c) => ({
        type: 'category',
        id: c.id,
        title: c.name,
        subtitle: c.slug,
        href: `/kategoriler?q=${encodeURIComponent(c.name)}`,
      })),
    );
    push(
      'customers',
      'Müşteriler',
      customers.map((u) => ({
        type: 'customer',
        id: u.id,
        title: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        subtitle: u.email,
        href: `/musteriler/${u.id}`,
      })),
    );
    push(
      'staff_requests',
      'Personel talepleri',
      staffRequests.map((u) => ({
        type: 'staff_request',
        id: u.id,
        title: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        subtitle: `${u.email} · onay bekliyor`,
        href: '/personel-onaylari',
      })),
    );
    push(
      'returns',
      'İadeler',
      returns.map((r) => ({
        type: 'return',
        id: r.id,
        title: r.order?.orderNumber || r.id.slice(0, 8),
        subtitle: `${r.type} · ${r.status}`,
        href: `/iadeler`,
      })),
    );
    push(
      'coupons',
      'Kuponlar',
      coupons.map((c) => ({
        type: 'coupon',
        id: c.id,
        title: c.code,
        subtitle: c.title || undefined,
        href: `/kuponlar?q=${encodeURIComponent(c.code)}`,
      })),
    );
    push(
      'campaigns',
      'Kampanyalar',
      campaigns.map((c) => ({
        type: 'campaign',
        id: c.id,
        title: c.name,
        subtitle: c.slug,
        href: `/kampanyalar?q=${encodeURIComponent(c.name)}`,
      })),
    );
    push(
      'reviews',
      'Yorumlar',
      reviews.map((r) => ({
        type: 'review',
        id: r.id,
        title: r.title || r.authorName,
        subtitle: [r.product?.name, r.isApproved ? 'onaylı' : 'bekliyor']
          .filter(Boolean)
          .join(' · '),
        href: '/yorumlar',
      })),
    );
    push(
      'shipping',
      'Kargo',
      shipping.map((s) => ({
        type: 'shipping',
        id: s.id,
        title: s.displayName,
        subtitle: `${s.provider}${s.isEnabled ? '' : ' · kapalı'}`,
        href: '/kargo',
      })),
    );
    push(
      'marketplace',
      'Pazaryeri',
      [
        ...marketplaceAccounts.map((a) => ({
          type: 'marketplace_account',
          id: a.id,
          title: a.storeName,
          subtitle: a.platform,
          href: '/pazaryeri',
        })),
        ...marketplaceOrders.map((o) => ({
          type: 'marketplace_order',
          id: o.id,
          title: o.externalOrderId,
          subtitle: [o.account?.storeName, o.externalStatus]
            .filter(Boolean)
            .join(' · '),
          href: o.internalOrderId
            ? `/siparisler/${o.internalOrderId}`
            : '/pazaryeri',
        })),
      ].slice(0, per),
    );
    push(
      'messages',
      'Mesajlar',
      messages.map((m) => ({
        type: 'message',
        id: m.id,
        title: m.senderName,
        subtitle: m.senderEmail,
        href: `/mesajlar?id=${encodeURIComponent(m.id)}`,
      })),
    );
    push(
      'media',
      'Medya',
      media.map((a) => ({
        type: 'media',
        id: a.id,
        title: a.filename,
        subtitle: a.mimeType,
        href: `/medya?q=${encodeURIComponent(a.filename)}`,
      })),
    );
    push(
      'newsletter',
      'Bülten',
      newsletter.map((n) => ({
        type: 'newsletter',
        id: n.id,
        title: n.email,
        subtitle: n.source,
        href: `/bulten?q=${encodeURIComponent(n.email)}`,
      })),
    );
    push(
      'legal',
      'Sözleşmeler',
      legal.map((d) => ({
        type: 'legal',
        id: d.id,
        title: d.title,
        subtitle: d.slug,
        href: `/sozlesmeler?q=${encodeURIComponent(d.slug)}`,
      })),
    );
    push(
      'blog',
      'Blog',
      posts.map((p) => ({
        type: 'blog',
        id: p.id,
        title: p.title,
        subtitle: p.isPublished ? 'published' : 'draft',
        href: `/blog?q=${encodeURIComponent(p.title)}`,
      })),
    );

    return { q: term, groups };
  }

  async searchOps(q: string, limit = 8): Promise<SearchResponse> {
    const term = q.trim();
    if (term.length < 2) {
      return { q: term, groups: [] };
    }
    const like = `%${term}%`;
    const per = Math.min(limit, 12);

    const [
      products,
      orders,
      categories,
      messages,
      newsletter,
      parties,
      invoices,
      coupons,
      campaigns,
      customers,
      returns,
      reviews,
      cashAccounts,
      okcSales,
      staffRequests,
      shipping,
    ] = await Promise.all([
      this.em
        .createQueryBuilder(Product, 'p')
        .where(
          `(p.name ILIKE :like OR p.slug ILIKE :like OR COALESCE(p.batchId,'') ILIKE :like)`,
          { like },
        )
        .orderBy('p.updatedAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Order, 'o')
        .where(
          `(o.orderNumber ILIKE :like OR o.customerEmail ILIKE :like OR o.customerName ILIKE :like OR o.customerPhone ILIKE :like)`,
          { like },
        )
        .orderBy('o.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Category, 'c')
        .where(`(c.name ILIKE :like OR c.slug ILIKE :like)`, { like })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ContactMessage, 'm')
        .where(
          `(m.senderName ILIKE :like OR m.senderEmail ILIKE :like OR m.message ILIKE :like)`,
          { like },
        )
        .orderBy('m.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(NewsletterSubscriber, 'n')
        .where(`n.email ILIKE :like`, { like })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Party, 'pt')
        .where(
          `(pt.title ILIKE :like OR COALESCE(pt.taxNumber,'') ILIKE :like OR COALESCE(pt.email,'') ILIKE :like OR COALESCE(pt.phone,'') ILIKE :like)`,
          { like },
        )
        .orderBy('pt.updatedAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Invoice, 'inv')
        .leftJoinAndSelect('inv.party', 'party')
        .where(
          `(inv.invoiceNumber ILIKE :like OR COALESCE(party.title,'') ILIKE :like)`,
          { like },
        )
        .orderBy('inv.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Coupon, 'cp')
        .where(`(cp.code ILIKE :like OR COALESCE(cp.title,'') ILIKE :like)`, {
          like,
        })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(Campaign, 'cm')
        .where(`(cm.name ILIKE :like OR cm.slug ILIKE :like)`, { like })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(User, 'u')
        .where('u.role = :role', { role: UserRole.CUSTOMER })
        .andWhere(
          `(u.email ILIKE :like OR COALESCE(u.firstName,'') ILIKE :like OR COALESCE(u.lastName,'') ILIKE :like OR COALESCE(u.phone,'') ILIKE :like)`,
          { like },
        )
        .orderBy('u.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ReturnRequest, 'r')
        .leftJoinAndSelect('r.order', 'ord')
        .where(
          `(COALESCE(ord.orderNumber,'') ILIKE :like OR r.reason ILIKE :like OR CAST(r.status AS text) ILIKE :like)`,
          { like },
        )
        .orderBy('r.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ProductReview, 'rv')
        .leftJoinAndSelect('rv.product', 'prod')
        .where(
          `(rv.authorName ILIKE :like OR COALESCE(rv.title,'') ILIKE :like OR rv.body ILIKE :like OR COALESCE(prod.name,'') ILIKE :like)`,
          { like },
        )
        .orderBy('rv.createdAt', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(CashAccount, 'ca')
        .where(`(ca.name ILIKE :like OR CAST(ca.kind AS text) ILIKE :like)`, {
          like,
        })
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(OkcSale, 'ok')
        .where(
          `(ok.externalKey ILIKE :like OR COALESCE(ok.receiptNo,'') ILIKE :like OR COALESCE(ok.zNo,'') ILIKE :like OR COALESCE(ok.description,'') ILIKE :like)`,
          { like },
        )
        .orderBy('ok.saleDate', 'DESC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(User, 'su')
        .where('su.role = :role', { role: UserRole.CUSTOMER })
        .andWhere('su.opsAccessRequestedAt IS NOT NULL')
        .andWhere('su.isActive = true')
        .andWhere(
          `(su.email ILIKE :like OR COALESCE(su.firstName,'') ILIKE :like OR COALESCE(su.lastName,'') ILIKE :like)`,
          { like },
        )
        .orderBy('su.opsAccessRequestedAt', 'ASC')
        .take(per)
        .getMany(),
      this.em
        .createQueryBuilder(ShippingProviderConfig, 'sp')
        .where(
          `(sp.displayName ILIKE :like OR CAST(sp.provider AS text) ILIKE :like)`,
          { like },
        )
        .take(per)
        .getMany(),
    ]);

    const groups: SearchResponse['groups'] = [];
    const push = (type: string, label: string, items: SearchHit[]) => {
      if (items.length) groups.push({ type, label, items });
    };

    push('pages', 'Sayfalar', this.matchPages(term, OPS_PAGES));

    push(
      'products',
      'Ürünler',
      products.map((p) => ({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: p.slug,
        href: '/urunler',
        screen: 'Products',
      })),
    );
    push(
      'orders',
      'Siparişler',
      orders.map((o) => ({
        type: 'order',
        id: o.id,
        title: o.orderNumber,
        subtitle: `${o.customerName} · ${o.status}`,
        href: '/siparisler',
        screen: 'ShopOrders',
      })),
    );
    push(
      'categories',
      'Kategoriler',
      categories.map((c) => ({
        type: 'category',
        id: c.id,
        title: c.name,
        subtitle: c.slug,
        href: '/kategoriler',
        screen: 'Categories',
      })),
    );
    push(
      'parties',
      'Cari',
      parties.map((p) => ({
        type: 'party',
        id: p.id,
        title: p.title,
        subtitle: [p.type === 'supplier' ? 'Tedarikçi' : 'Müşteri', p.taxNumber]
          .filter(Boolean)
          .join(' · '),
        href: '/cari',
        screen: 'Parties',
      })),
    );
    push(
      'invoices',
      'Faturalar',
      invoices.map((i) => ({
        type: 'invoice',
        id: i.id,
        title: i.invoiceNumber,
        subtitle: [i.party?.title, i.status].filter(Boolean).join(' · '),
        href: '/faturalar',
        screen: 'Invoices',
      })),
    );
    push(
      'cash',
      'Kasa',
      cashAccounts.map((c) => ({
        type: 'cash',
        id: c.id,
        title: c.name,
        subtitle: c.kind,
        href: '/kasa',
        screen: 'Cash',
      })),
    );
    push(
      'okc',
      'ÖKC',
      okcSales.map((s) => ({
        type: 'okc',
        id: s.id,
        title: s.receiptNo || s.externalKey,
        subtitle: [s.saleDate, s.zNo, `₺${s.total}`].filter(Boolean).join(' · '),
        href: '/okc',
        screen: 'Cash',
      })),
    );
    push(
      'coupons',
      'Kuponlar',
      coupons.map((c) => ({
        type: 'coupon',
        id: c.id,
        title: c.code,
        subtitle: c.title || undefined,
        href: '/kuponlar',
        screen: 'Coupons',
      })),
    );
    push(
      'campaigns',
      'Kampanyalar',
      campaigns.map((c) => ({
        type: 'campaign',
        id: c.id,
        title: c.name,
        subtitle: `%${c.discountPercent}`,
        href: '/kampanyalar',
        screen: 'Campaigns',
      })),
    );
    push(
      'customers',
      'Müşteriler',
      customers.map((u) => ({
        type: 'customer',
        id: u.id,
        title: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        subtitle: u.email,
        href: `/musteriler?id=${encodeURIComponent(u.id)}`,
        screen: 'CustomerDetail',
      })),
    );
    push(
      'staff_requests',
      'Personel talepleri',
      staffRequests.map((u) => ({
        type: 'staff_request',
        id: u.id,
        title: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        subtitle: `${u.email} · onay bekliyor`,
        href: '/personel-onaylari',
        screen: 'Notifications',
      })),
    );
    push(
      'returns',
      'İadeler',
      returns.map((r) => ({
        type: 'return',
        id: r.id,
        title: r.order?.orderNumber || r.id.slice(0, 8),
        subtitle: `${r.type} · ${r.status}`,
        href: '/iadeler',
        screen: 'Returns',
      })),
    );
    push(
      'reviews',
      'Yorumlar',
      reviews.map((r) => ({
        type: 'review',
        id: r.id,
        title: r.title || r.authorName,
        subtitle: r.product?.name,
        href: '/yorumlar',
        screen: 'Reviews',
      })),
    );
    push(
      'shipping',
      'Kargo',
      shipping.map((s) => ({
        type: 'shipping',
        id: s.id,
        title: s.displayName,
        subtitle: String(s.provider),
        href: '/kargo',
        screen: 'Shipping',
      })),
    );
    push(
      'messages',
      'Mesajlar',
      messages.map((m) => ({
        type: 'message',
        id: m.id,
        title: m.senderName,
        subtitle: m.senderEmail,
        href: '/mesajlar',
        screen: 'Messages',
      })),
    );
    push(
      'newsletter',
      'Bülten',
      newsletter.map((n) => ({
        type: 'newsletter',
        id: n.id,
        title: n.email,
        subtitle: n.source,
        href: '/bulten',
        screen: 'Newsletter',
      })),
    );

    return { q: term, groups };
  }

  private matchPages(term: string, pages: PageShortcut[]): SearchHit[] {
    const t = term.toLocaleLowerCase('tr-TR');
    return pages
      .filter((p) =>
        p.keywords.some(
          (k) => k.includes(t) || t.includes(k) || k.startsWith(t),
        ),
      )
      .slice(0, 6)
      .map((p) => ({
        type: 'page',
        id: p.href,
        title: p.title,
        subtitle: 'Sayfa',
        href: p.href,
        screen: p.screen,
      }));
  }
}
