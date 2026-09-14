import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketplacePlatform } from '@entities/marketplace-account.entity';
import {
  IMarketplaceAdapter,
  MarketplaceFulfillInput,
  MarketplaceFulfillResult,
  PushProductInput,
  PushProductResult,
  PulledOrder,
  SyncStockItem,
  hasMarketplaceCredentials,
} from '@modules/marketplace/adapters/marketplace.adapter';
import {
  asMockNoCredentials,
  basicAuthHeader,
  marketplaceFetch,
  MarketplaceHttpError,
  requireCreds,
} from '@modules/marketplace/adapters/marketplace-http';

/**
 * Hepsiburada Merchant API:
 * - Katalog: mpop[-sit].hepsiburada.com /product/api/products/import
 * - Listing/stok: listing-external[-sit]
 * - Sipariş: oms-external[-sit]
 *
 * Auth: Basic(username:password) + User-Agent (Developer Username)
 */
@Injectable()
export class HepsiburadaAdapter implements IMarketplaceAdapter {
  readonly platform = MarketplacePlatform.HEPSIBURADA;
  private readonly logger = new Logger(HepsiburadaAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private listingBase(): string {
    return (
      this.config.get<string>('marketplace.hepsiburada.listingBaseUrl') ||
      'https://listing-external.hepsiburada.com'
    ).replace(/\/$/, '');
  }

  private omsBase(): string {
    return (
      this.config.get<string>('marketplace.hepsiburada.omsBaseUrl') ||
      'https://oms-external.hepsiburada.com'
    ).replace(/\/$/, '');
  }

  private mpopBase(): string {
    return (
      this.config.get<string>('marketplace.hepsiburada.mpopBaseUrl') ||
      'https://mpop.hepsiburada.com'
    ).replace(/\/$/, '');
  }

  private auth(credentials: Record<string, string>) {
    const merchantId = credentials.merchantId?.trim();
    const username =
      credentials.username?.trim() || credentials.apiKey?.trim();
    const password =
      credentials.password?.trim() || credentials.apiSecret?.trim();
    if (!merchantId || !username || !password) {
      requireCreds(
        {
          merchantId: merchantId || '',
          username: username || '',
          password: password || '',
        },
        ['merchantId', 'username', 'password'],
        'Hepsiburada',
      );
    }
    const userAgent =
      credentials.userAgent?.trim() ||
      credentials.developerUsername?.trim() ||
      this.config.get<string>('marketplace.hepsiburada.userAgent') ||
      'kiliccoffeeroaster_dev';
    return {
      merchantId: merchantId!,
      Authorization: basicAuthHeader(username!, password!),
      'User-Agent': userAgent,
    };
  }

  async syncStock(
    credentials: Record<string, string>,
    items: SyncStockItem[],
  ) {
    if (!hasMarketplaceCredentials(credentials)) {
      return {
        synced: items.length,
        ...asMockNoCredentials('Hepsiburada'),
        raw: { mock: true, items: items.map((i) => i.externalListingId) },
      };
    }

    const auth = this.auth(credentials);
    const results: unknown[] = [];
    let synced = 0;

    try {
      for (const item of items) {
        const sku = encodeURIComponent(item.sku || item.externalListingId);
        const res = await marketplaceFetch(
          `${this.listingBase()}/listings/merchantid/${auth.merchantId}/sku/${sku}`,
          {
            method: 'PUT',
            headers: {
              Authorization: auth.Authorization,
              'User-Agent': auth['User-Agent'],
            },
            body: { AvailableStock: Math.max(0, item.stock) },
            label: 'hb.syncStock',
          },
        );
        results.push(res.data);
        synced += 1;
      }
      return {
        synced,
        mock: false,
        stub: false,
        message: `${synced} SKU stok güncellendi`,
        raw: { results },
      };
    } catch (err) {
      throw this.wrap(err, 'Stok sync');
    }
  }

  async pullOrders(credentials: Record<string, string>) {
    if (!hasMarketplaceCredentials(credentials)) {
      return {
        orders: [
          {
            externalOrderId: `MOCK-HB-${Date.now()}`,
            externalStatus: 'Open',
            payload: { mock: true, platform: this.platform },
          },
        ] as PulledOrder[],
        ...asMockNoCredentials('Hepsiburada'),
      };
    }

    const auth = this.auth(credentials);
    const qs = new URLSearchParams({
      offset: '0',
      limit: '50',
    });

    try {
      const orderRows = await this.fetchOrderRows(auth, qs);
      const packageRows = await this.fetchPackageRows(auth, qs);

      const byId = new Map<string, PulledOrder>();
      for (const row of orderRows) {
        const id = String(
          row.orderNumber || row.id || row.orderId || '',
        ).trim();
        if (!id) continue;
        byId.set(id, {
          externalOrderId: id,
          externalStatus: String(row.status || row.orderStatus || 'Open'),
          payload: row,
        });
      }

      for (const { row, statusHint } of packageRows) {
        const id = String(
          row.orderNumber ||
            row.OrderNumber ||
            row.orderId ||
            row.id ||
            '',
        ).trim();
        if (!id) continue;
        const pkgStatus = String(
          row.status || row.packageStatus || statusHint || 'Packaged',
        );
        const existing = byId.get(id);
        if (!existing) {
          byId.set(id, {
            externalOrderId: id,
            externalStatus: pkgStatus,
            payload: { ...row, _source: 'package' },
          });
          continue;
        }
        if (statusRank(pkgStatus) >= statusRank(existing.externalStatus)) {
          existing.externalStatus = pkgStatus;
          existing.payload = {
            ...existing.payload,
            package: row,
            packageNumber:
              row.packageNumber ||
              row.PackageNumber ||
              existing.payload.packageNumber,
            barcode: row.barcode || row.Barcode || existing.payload.barcode,
            trackingNumber:
              row.trackingNumber ||
              row.TrackingNumber ||
              existing.payload.trackingNumber,
          };
        }
      }

      const orders = [...byId.values()];
      return {
        orders,
        mock: false,
        stub: false,
        message: `${orders.length} sipariş/paket çekildi`,
      };
    } catch (err) {
      throw this.wrap(err, 'Sipariş çekme');
    }
  }

  async fulfillOrder(
    credentials: Record<string, string>,
    input: MarketplaceFulfillInput,
  ): Promise<MarketplaceFulfillResult> {
    if (!hasMarketplaceCredentials(credentials)) {
      return {
        ok: true,
        mock: true,
        packageNumber: `MOCK-PKG-${Date.now()}`,
        trackingNumber: input.trackingNumber,
        message: 'Credentials yok — paket simüle edildi',
        raw: { mock: true, input },
      };
    }

    const auth = this.auth(credentials);
    const cargoCompany =
      input.cargoCompany?.trim() ||
      credentials.cargoCompany?.trim() ||
      'HepsiJet';

    try {
      let lineItems = extractLineItemIds(input.payload);
      if (!lineItems.length) {
        const detail = await this.fetchOrderDetail(
          auth,
          input.externalOrderId,
        );
        if (detail) {
          lineItems = extractLineItemIds(detail);
        }
      }
      if (!lineItems.length) {
        throw new MarketplaceHttpError(
          'HB paketleme: siparişte line item id bulunamadı',
          400,
          { externalOrderId: input.externalOrderId },
        );
      }

      const existingPkg = String(
        (input.payload.hbFulfillment as Record<string, unknown> | undefined)
          ?.packageNumber ||
          input.payload.packageNumber ||
          '',
      ).trim();

      let packageNumber = existingPkg;
      let trackingNumber = input.trackingNumber?.trim() || undefined;
      let labelUrl: string | undefined;
      let createRaw: Record<string, unknown> = {};

      if (!packageNumber) {
        const res = await marketplaceFetch<Record<string, unknown> | string>(
          `${this.omsBase()}/packages/merchantId/${auth.merchantId}`,
          {
            method: 'POST',
            headers: {
              Authorization: auth.Authorization,
              'User-Agent': auth['User-Agent'],
            },
            body: { lineItems, cargoCompany },
            label: 'hb.createPackages',
          },
        );
        createRaw =
          res.data && typeof res.data === 'object'
            ? (res.data as Record<string, unknown>)
            : { raw: res.data };
        packageNumber = String(
          createRaw.packageNumber ||
            createRaw.PackageNumber ||
            createRaw.id ||
            '',
        ).trim();
        trackingNumber =
          trackingNumber ||
          strOpt(createRaw.trackingNumber || createRaw.barcode) ||
          undefined;
        labelUrl = strOpt(createRaw.labelUrl || createRaw.url) || undefined;
      }

      let intransitRaw: Record<string, unknown> | null = null;
      const needsInTransit =
        Boolean(packageNumber) &&
        cargoCompany.toLowerCase() !== 'hepsijet' &&
        Boolean(trackingNumber);

      if (needsInTransit && packageNumber) {
        const res = await marketplaceFetch<Record<string, unknown> | string>(
          `${this.omsBase()}/packages/merchantId/${auth.merchantId}/packagenumber/${encodeURIComponent(packageNumber)}/intransit`,
          {
            method: 'POST',
            headers: {
              Authorization: auth.Authorization,
              'User-Agent': auth['User-Agent'],
            },
            body: { trackingNumber },
            label: 'hb.markInTransit',
          },
        );
        intransitRaw =
          res.data && typeof res.data === 'object'
            ? (res.data as Record<string, unknown>)
            : { raw: res.data };
      }

      return {
        ok: true,
        mock: false,
        packageNumber: packageNumber || undefined,
        trackingNumber,
        labelUrl,
        message: packageNumber
          ? `Paket ${packageNumber} bildirildi (${cargoCompany})`
          : 'Paketleme isteği gönderildi',
        raw: {
          create: createRaw,
          intransit: intransitRaw,
          lineItems,
          cargoCompany,
        },
      };
    } catch (err) {
      throw this.wrap(err, 'Paketleme');
    }
  }

  private async fetchOrderRows(
    auth: { merchantId: string; Authorization: string; 'User-Agent': string },
    qs: URLSearchParams,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const res = await marketplaceFetch<
        | Array<Record<string, unknown>>
        | {
            items?: Array<Record<string, unknown>>;
            data?: Array<Record<string, unknown>>;
          }
      >(`${this.omsBase()}/orders/merchantid/${auth.merchantId}?${qs}`, {
        method: 'GET',
        headers: {
          Authorization: auth.Authorization,
          'User-Agent': auth['User-Agent'],
        },
        label: 'hb.pullOrders',
      });
      return Array.isArray(res.data)
        ? res.data
        : res.data?.items || res.data?.data || [];
    } catch (err) {
      if (err instanceof MarketplaceHttpError && err.status === 404) {
        const res = await marketplaceFetch<{
          items?: Array<Record<string, unknown>>;
        }>(`${this.omsBase()}/orders?${qs}`, {
          method: 'GET',
          headers: {
            Authorization: auth.Authorization,
            'User-Agent': auth['User-Agent'],
          },
          label: 'hb.pullOrders.alt',
        });
        return res.data?.items || [];
      }
      throw err;
    }
  }

  private async fetchPackageRows(
    auth: { merchantId: string; Authorization: string; 'User-Agent': string },
    qs: URLSearchParams,
  ): Promise<Array<{ row: Record<string, unknown>; statusHint: string }>> {
    const paths: Array<{ path: string; statusHint: string }> = [
      {
        path: `/packages/merchantId/${auth.merchantId}?${qs}`,
        statusHint: 'Packaged',
      },
      {
        path: `/packages/merchantId/${auth.merchantId}/shipped?${qs}`,
        statusHint: 'InTransit',
      },
      {
        path: `/packages/merchantId/${auth.merchantId}/delivered?${qs}`,
        statusHint: 'Delivered',
      },
    ];
    const out: Array<{ row: Record<string, unknown>; statusHint: string }> =
      [];
    for (const { path, statusHint } of paths) {
      try {
        const res = await marketplaceFetch<
          | Array<Record<string, unknown>>
          | {
              items?: Array<Record<string, unknown>>;
              data?: Array<Record<string, unknown>>;
            }
        >(`${this.omsBase()}${path}`, {
          method: 'GET',
          headers: {
            Authorization: auth.Authorization,
            'User-Agent': auth['User-Agent'],
          },
          label: `hb.pullPackages.${statusHint}`,
        });
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.items || res.data?.data || [];
        for (const row of list) {
          out.push({ row, statusHint });
        }
      } catch (err) {
        if (err instanceof MarketplaceHttpError && err.status === 404) {
          continue;
        }
        this.logger.warn(
          `HB paket listesi (${statusHint}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
    return out;
  }

  private async fetchOrderDetail(
    auth: { merchantId: string; Authorization: string; 'User-Agent': string },
    orderNumber: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const res = await marketplaceFetch<Record<string, unknown>>(
        `${this.omsBase()}/orders/merchantId/${auth.merchantId}/ordernumber/${encodeURIComponent(orderNumber)}`,
        {
          method: 'GET',
          headers: {
            Authorization: auth.Authorization,
            'User-Agent': auth['User-Agent'],
          },
          label: 'hb.orderDetail',
        },
      );
      return res.data && typeof res.data === 'object' ? res.data : null;
    } catch (err) {
      this.logger.warn(
        `HB sipariş detayı alınamadı (${orderNumber}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  async pushProduct(
    credentials: Record<string, string>,
    input: PushProductInput,
  ): Promise<PushProductResult> {
    if (!hasMarketplaceCredentials(credentials)) {
      return {
        externalListingId: `hb-mock-${input.productId.slice(0, 8)}-${Date.now()}`,
        mock: true,
        stub: false,
        message: 'Credentials yok — listing ID simüle edildi',
        rawResponse: { mock: true, input },
      };
    }

    const categoryId = input.hepsiburadaCategoryId?.trim() || '';
    if (!categoryId) {
      return {
        externalListingId: '',
        mock: false,
        stub: false,
        skipped: true,
        message:
          'Atlandı: üründe Hepsiburada leaf kategori ID yok. Admin → Ürünler’den girilince gönderilir.',
        rawResponse: {
          skipped: true,
          reason: 'missing_hepsiburada_category_id',
        },
      };
    }

    const brand =
      credentials.brand?.trim() ||
      credentials.Marka?.trim() ||
      credentials.brandName?.trim();
    if (!brand) {
      return {
        externalListingId: '',
        mock: false,
        stub: false,
        message:
          'Ürün gönderimi için credentials içinde brand (Marka) gerekli.',
        rawResponse: {
          error: 'missing_brand',
          hint: 'Hesap credentials JSON: brand',
        },
      };
    }

    const auth = this.auth(credentials);
    const merchantSku = (input.sku || input.productId).slice(0, 100);
    const barcode =
      input.barcode?.trim() ||
      credentials.barcode?.trim() ||
      this.fallbackBarcode(merchantSku, input.productId);
    const imageUrl =
      input.imageUrl?.trim() ||
      credentials.imageUrl?.trim() ||
      undefined;
    const taxVatRate = credentials.taxVatRate?.trim() || '20';
    const warrantyMonths = Number(credentials.warrantyMonths || 24);
    const extra = this.parseExtraAttributes(credentials);
    const varyantGroupId = (
      input.varyantGroupId?.trim() ||
      credentials.varyantGroupId?.trim() ||
      input.productId
    ).slice(0, 40);
    const displayName = (() => {
      const parts = [input.name];
      if (input.weightLabel?.trim()) parts.push(input.weightLabel.trim());
      if (input.grindOption === 'whole_bean') parts.push('Çekirdek');
      else if (input.grindOption === 'ground') parts.push('Öğütülmüş');
      if (input.roastOption === 'orta') parts.push('Orta kavrum');
      else if (input.roastOption === 'orta_koyu') parts.push('Orta-Koyu kavrum');
      else if (input.roastOption === 'koyu') parts.push('Koyu kavrum');
      return parts.join(' — ').slice(0, 200);
    })();

    // HB kategori şemasında olmayan özel alanlar (grind/roast/kg) import'ta
    // sunucu tarafında 500 üretebiliyor — yalnızca isimde taşınır; attributes'a yazılmaz.
    const attributes: Record<string, unknown> = {
      merchantSku,
      Barcode: barcode,
      UrunAdi: displayName,
      UrunAciklamasi: (input.description || input.name).slice(0, 5000),
      Marka: brand,
      tax_vat_rate: String(taxVatRate),
      GarantiSuresi: String(
        Number.isFinite(warrantyMonths) ? warrantyMonths : 24,
      ),
      VaryantGroupID: varyantGroupId,
      ...extra,
    };
    if (imageUrl) {
      attributes.Image1 = imageUrl;
    }
    if (input.price != null && String(input.price).trim() !== '') {
      const priceNum = Number(input.price);
      if (Number.isFinite(priceNum) && priceNum > 0) {
        attributes.price = priceNum;
      }
    }
    if (typeof input.stock === 'number') {
      attributes.stock = Math.max(0, input.stock);
    }

    const categoryIdNum = Number(categoryId);
    const body = [
      {
        categoryId: Number.isFinite(categoryIdNum) ? categoryIdNum : categoryId,
        merchant: auth.merchantId,
        attributes,
      },
    ];

    const mpop = this.mpopBase();
    try {
      const res = await marketplaceFetch<Record<string, unknown>>(
        `${mpop}/product/api/products/import`,
        {
          method: 'POST',
          headers: {
            Authorization: auth.Authorization,
            'User-Agent': auth['User-Agent'],
          },
          body,
          label: 'hb.pushProduct.import',
          timeoutMs: 45_000,
        },
      );

      const trackingId = String(
        res.data?.trackingId ||
          (res.data as { data?: { trackingId?: string } })?.data
            ?.trackingId ||
          '',
      );

      let importStatus: Record<string, unknown> | null = null;
      if (trackingId) {
        importStatus = await this.pollImportStatus(auth, trackingId);
      }

      // Listing oluştuysa stok bilgisini hemen yaz (katalog onayı gecikse bile SKU hazır olabilir)
      let stockPush: unknown = null;
      try {
        stockPush = await this.pushListingStock(
          auth,
          merchantSku,
          Math.max(0, input.stock),
          Number(input.price) || undefined,
        );
      } catch (stockErr) {
        this.logger.warn(
          `HB stok yazımı (push sonrası): ${
            stockErr instanceof Error ? stockErr.message : String(stockErr)
          }`,
        );
      }

      const statusLabel =
        (importStatus?.status as string) ||
        (trackingId ? 'SUBMITTED' : 'UNKNOWN');

      return {
        externalListingId: merchantSku,
        mock: false,
        stub: false,
        message: trackingId
          ? `Hepsiburada katalog import kuyruğa alındı (trackingId=${trackingId}, status=${statusLabel}). Stok sync merchantSku=${merchantSku}`
          : `Hepsiburada katalog import gönderildi; merchantSku=${merchantSku}`,
        rawResponse: {
          trackingId,
          import: res.data as Record<string, unknown>,
          importStatus,
          stockPush,
          merchantSku,
          barcode,
          mpopBaseUrl: mpop,
        },
      };
    } catch (err) {
      if (err instanceof MarketplaceHttpError) {
        this.logger.warn(
          `Hepsiburada Ürün gönderimi: ${err.message} (mpop=${mpop})`,
        );
        throw new BadRequestException({
          message: `Hepsiburada Ürün gönderimi: ${err.message}`,
          hepsiburadaStatus: err.status,
          hepsiburadaBody: err.body,
          debug: {
            mpopBaseUrl: mpop,
            userAgent: auth['User-Agent'],
            categoryId: Number.isFinite(categoryIdNum)
              ? categoryIdNum
              : categoryId,
            merchantSku,
            barcode,
            attributeKeys: Object.keys(attributes),
            hint:
              mpop.includes('-sit') === false
                ? 'Canlı MPOP kullanılıyor. Test (SIT) merchant ile çalışıyorsanız sunucuya HEPSIBURADA_MPOP_BASE_URL=https://mpop-sit.hepsiburada.com (ve listing/oms -sit) ekleyin.'
                : 'SIT MPOP kullanılıyor. Kategori leaf mi, Marka HB’de tanımlı mı, zorunlu attribute’lar credentials.attributes içinde mi kontrol edin.',
          },
        });
      }
      throw this.wrap(err, 'Ürün gönderimi');
    }
  }

  private async pollImportStatus(
    auth: { Authorization: string; 'User-Agent': string },
    trackingId: string,
  ): Promise<Record<string, unknown> | null> {
    const maxAttempts = 5;
    let last: Record<string, unknown> | null = null;
    for (let i = 0; i < maxAttempts; i += 1) {
      try {
        const res = await marketplaceFetch<Record<string, unknown>>(
          `${this.mpopBase()}/product/api/products/status/${encodeURIComponent(trackingId)}`,
          {
            method: 'GET',
            headers: {
              Authorization: auth.Authorization,
              'User-Agent': auth['User-Agent'],
            },
            label: 'hb.pushProduct.status',
            timeoutMs: 15_000,
          },
        );
        last = (res.data || {}) as Record<string, unknown>;
        const status = String(last.status || '').toUpperCase();
        if (
          status === 'DONE' ||
          status === 'COMPLETED' ||
          status === 'FAILED' ||
          status === 'ERROR'
        ) {
          return last;
        }
      } catch (err) {
        this.logger.warn(
          `HB import status poll: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        break;
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    return last;
  }

  private async pushListingStock(
    auth: {
      merchantId: string;
      Authorization: string;
      'User-Agent': string;
    },
    merchantSku: string,
    stock: number,
    price?: number,
  ) {
    const body: Record<string, unknown> = {
      AvailableStock: Math.max(0, stock),
    };
    if (price != null && Number.isFinite(price) && price > 0) {
      body.Price = price;
    }
    const res = await marketplaceFetch(
      `${this.listingBase()}/listings/merchantid/${auth.merchantId}/sku/${encodeURIComponent(merchantSku)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: auth.Authorization,
          'User-Agent': auth['User-Agent'],
        },
        body,
        label: 'hb.pushProduct.stock',
      },
    );
    return res.data;
  }

  private parseExtraAttributes(
    credentials: Record<string, string>,
  ): Record<string, unknown> {
    const bag = credentials as Record<string, unknown>;
    for (const key of ['attributes', 'extraAttributes', 'attributesJson'] as const) {
      const raw = bag[key];
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return raw as Record<string, unknown>;
      }
      if (typeof raw === 'string' && raw.trim()) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        } catch {
          this.logger.warn(
            'Hepsiburada credentials.attributes JSON parse edilemedi',
          );
        }
      }
    }
    return {};
  }

  /** "250g" / "1kg" → gram; parse edilemezse null */
  private parseGrams(weightLabel: string): number | null {
    const s = weightLabel.trim().toLowerCase().replace(',', '.');
    const kg = s.match(/^([\d.]+)\s*kg$/);
    if (kg) {
      const n = Number(kg[1]);
      return Number.isFinite(n) ? Math.round(n * 1000) : null;
    }
    const g = s.match(/^([\d.]+)\s*g(r|ram)?$/);
    if (g) {
      const n = Number(g[1]);
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    return null;
  }

  /** HB Barcode zorunlu; gerçek EAN yoksa deterministik 13 hane üretir (test için). */
  private fallbackBarcode(merchantSku: string, productId: string): string {
    const digits = `${merchantSku}${productId}`.replace(/\D/g, '');
    const base = (digits + '8690000000000').slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i += 1) {
      const n = Number(base[i] || 0);
      sum += i % 2 === 0 ? n : n * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return `${base}${check}`;
  }

  private wrap(err: unknown, action: string): never {
    if (err instanceof MarketplaceHttpError) {
      this.logger.warn(`Hepsiburada ${action}: ${err.message}`);
      throw new BadRequestException({
        message: `Hepsiburada ${action}: ${err.message}`,
        hepsiburadaStatus: err.status,
        hepsiburadaBody: err.body,
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    this.logger.warn(`Hepsiburada ${action}: ${message}`);
    throw new BadRequestException(`Hepsiburada ${action}: ${message}`);
  }
}

function statusRank(status: string | null | undefined): number {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel') || s.includes('unsupply') || s === 'unpacked') {
    return 50;
  }
  if (s.includes('deliver') && !s.includes('undeliver')) return 40;
  if (
    s.includes('intransit') ||
    s.includes('in_transit') ||
    s.includes('ship') ||
    s.includes('cargo')
  ) {
    return 30;
  }
  if ((s.includes('packag') || s.includes('packed')) && !s.includes('unpack')) {
    return 20;
  }
  return 10;
}

function strOpt(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function extractLineItemIds(payload: Record<string, unknown>): string[] {
  const bags: unknown[] = [
    payload.lineItems,
    payload.LineItems,
    payload.items,
    payload.Items,
    payload.orderItems,
    payload.OrderItems,
    (payload.package as Record<string, unknown> | undefined)?.lineItems,
    (payload.package as Record<string, unknown> | undefined)?.items,
  ];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const bag of bags) {
    if (!Array.isArray(bag)) continue;
    for (const row of bag) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const id = strOpt(
        r.id ??
          r.Id ??
          r.lineItemId ??
          r.LineItemId ??
          r.orderLineId ??
          r.OrderLineId,
      );
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return ids;
}
