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
    const rows = items
      .map((item) => ({
        merchantSku: (item.sku || item.externalListingId || '').trim(),
        availableStock: Math.max(0, Math.floor(Number(item.stock) || 0)),
      }))
      .filter((row) => row.merchantSku);
    if (!rows.length) {
      return {
        synced: 0,
        mock: false,
        stub: false,
        message: 'Stok senkronu için SKU yok',
        raw: { results: [] },
      };
    }

    const results: unknown[] = [];
    let synced = 0;

    try {
      for (let i = 0; i < rows.length; i += 1000) {
        const chunk = rows.slice(i, i + 1000);
        const data = await this.uploadListingInventory(auth, chunk, 'hb.syncStock');
        results.push(data);
        synced += chunk.length;
      }
      return {
        synced,
        mock: false,
        stub: false,
        message: `${synced} SKU stok güncellemesi kuyruğa alındı`,
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
          hint: 'Hesap credentials JSON: brand — HB’de tanımlı marka adı (UUID/merchantId değil)',
        },
      };
    }
    const merchantIdHint =
      credentials.merchantId?.trim() || credentials.username?.trim() || '';
    if (
      looksLikeUuid(brand) ||
      (merchantIdHint && brand.toLowerCase() === merchantIdHint.toLowerCase())
    ) {
      throw new BadRequestException({
        message:
          'Hepsiburada Marka alanı merchantId/UUID olamaz. credentials.brand = HB satıcı panelindeki marka adı olmalı (ör. "Kılıç Coffee Roaster").',
        receivedBrand: brand,
        hint: 'Admin → Pazaryeri → credentials JSON içinde "brand" değerini düzeltin.',
      });
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
    const taxVatRate = credentials.taxVatRate?.trim() || '1';
    const warrantyMonths = Number(credentials.warrantyMonths || 24);
    const accountExtra = this.parseExtraAttributes(credentials);
    const productExtra = normalizeHbAttrMap(input.hepsiburadaAttributes);
    // Ürün override > hesap credentials.attributes
    const extra = { ...accountExtra, ...productExtra };
    // HB VaryantGroupID: tireli UUID yerine alfanümerik daha güvenli
    const varyantGroupId = (
      input.varyantGroupId?.trim() ||
      credentials.varyantGroupId?.trim() ||
      input.productId
    )
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 40);
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
    const description = (input.description || input.name)
      .slice(0, 5000)
      .replace(/[·•]/g, '-');
    // HB "Desi" attribute id = kg → kargo desisi (1, 2…), ürün gramajı değil
    const desiValue =
      credentials.desi?.trim() ||
      credentials.Desi?.trim() ||
      (typeof extra.kg === 'string' && extra.kg.trim()) ||
      (typeof extra.Desi === 'string' && extra.Desi.trim()) ||
      '1';

    const categoryIdNum = Number(categoryId);
    const resolvedCategoryId = Number.isFinite(categoryIdNum)
      ? categoryIdNum
      : categoryId;

    // Import body anahtarı = attribute.id (merchantSku, kg, 00001STC…)
    const valueByKey: Record<string, unknown> = {
      merchantSku,
      Barcode: barcode,
      UrunAdi: displayName,
      UrunAciklamasi: description,
      Marka: brand,
      GarantiSuresi: Number.isFinite(warrantyMonths) ? warrantyMonths : 24,
      tax_vat_rate: String(taxVatRate),
      VaryantGroupID: varyantGroupId,
      kg: String(desiValue),
      Desi: String(desiValue),
      desi: String(desiValue),
      ...(imageUrl
        ? {
            Image1: imageUrl,
            '00000MU': imageUrl, // Paket Görseli (ön)
          }
        : {}),
      // price/stock katalogda opsiyonel; SIT’te 500 tetikleyebildiği için default göndermiyoruz
      ...extra,
    };

    const schema = await this.fetchCategoryAttributes(auth, resolvedCategoryId);
    let attributes: Record<string, unknown> = {};

    if (schema.length) {
      for (const attr of schema) {
        const importKey = String(attr.id || '').trim();
        if (!importKey) continue;

        let rawValue = resolveHbAttributeValue(attr, valueByKey);
        const explicitOverride =
          extra[importKey] !== undefined &&
          extra[importKey] !== null &&
          String(extra[importKey]).trim() !== '';

        // Enum (ör. Miktar → 00001STC): serbest metin değil, HB value listesinden seç.
        // credentials.attributes[id] verilmişse API listesi boş olsa bile güvenilir override.
        if (
          attr.type === 'enum' &&
          (rawValue != null || attr.mandatory) &&
          attr.id != null
        ) {
          if (explicitOverride) {
            rawValue = String(extra[importKey]).trim();
          } else {
            const enumResult = await this.resolveEnumAttributeValue(
              auth,
              resolvedCategoryId,
              attr.id,
              rawValue ?? input.weightLabel,
              attr.name,
            );
            if (enumResult.value != null) {
              rawValue = enumResult.value;
            } else if (attr.mandatory) {
              const guessed =
                importKey === '00001STC' || attr.name === 'Miktar'
                  ? guessMiktarEnumValue(rawValue ?? input.weightLabel)
                  : null;
              if (guessed) {
                this.logger.warn(
                  `HB Miktar enum listesi boş/eşleşmedi; tahmini değer kullanılıyor: ${guessed}`,
                );
                rawValue = guessed;
              } else {
                throw new BadRequestException({
                  message: `Hepsiburada enum değeri eşleşmedi: ${attr.name || attr.id}`,
                  attributeId: attr.id,
                  attributeName: attr.name,
                  tried: rawValue ?? input.weightLabel,
                  sampleValues: enumResult.samples,
                  valuesHttp: enumResult.debug,
                  hint: `Bu kategori için Admin → Ürün → Hepsiburada attributes JSON’a attribute.id yazın (ör. {"${attr.id}":"${enumResult.samples[0] || 'değer'}"}). Miktar, varyant gramajından "100 gr" / "1 kg" biçimine çevrilir; Türü gibi tür alanları JSON’da kalır.`,
                });
              }
            } else {
              rawValue = undefined;
            }
          }
        }

        if (rawValue === undefined || rawValue === null || rawValue === '') {
          continue;
        }
        attributes[importKey] = coerceHbAttributeValue(rawValue, attr.type);
      }

      const missingMandatory = schema
        .filter(
          (a) =>
            a.mandatory &&
            a.id != null &&
            (attributes[String(a.id)] === undefined ||
              attributes[String(a.id)] === null ||
              attributes[String(a.id)] === ''),
        )
        .map((a) => ({
          name: a.name,
          id: a.id,
          type: a.type,
          group: a.group,
        }));

      if (missingMandatory.length) {
        throw new BadRequestException({
          message:
            'Hepsiburada: kategorinin zorunlu attribute’ları eksik veya enum değeri eşleşmedi.',
          missingMandatory,
          filledKeys: Object.keys(attributes),
          hint:
            'Import anahtarı attribute.id’dir (ör. Desi→kg, Miktar→00001STC). Miktar için HB enum değerlerinden birini credentials.attributes["00001STC"] olarak verin veya weightLabel’ı listedeki ada yakın tutun (100 g).',
        });
      }
    } else {
      attributes = {
        merchantSku,
        Barcode: barcode,
        UrunAdi: displayName,
        UrunAciklamasi: description,
        Marka: brand,
        tax_vat_rate: String(taxVatRate),
        GarantiSuresi: Number.isFinite(warrantyMonths) ? warrantyMonths : 24,
        VaryantGroupID: varyantGroupId,
        kg: String(desiValue),
        ...extra,
      };
      if (imageUrl) {
        attributes.Image1 = imageUrl;
        attributes['00000MU'] = imageUrl;
      }
      const guessedMiktar = guessMiktarEnumValue(input.weightLabel);
      if (guessedMiktar) attributes['00001STC'] = guessedMiktar;
    }

    const body = [
      {
        categoryId: resolvedCategoryId,
        merchant: auth.merchantId,
        attributes,
      },
    ];

    const mpop = this.mpopBase();
    const importUrl = `${mpop}/product/api/products/import`;
    try {
      // HB dokümanı: JSON body değil, multipart/form-data ile `file` (JSON dosyası)
      const res = await marketplaceFetch<Record<string, unknown>>(importUrl, {
        method: 'POST',
        headers: {
          Authorization: auth.Authorization,
          'User-Agent': auth['User-Agent'],
        },
        body,
        multipartJsonFile: {
          fieldName: 'file',
          filename: 'products.json',
        },
        label: 'hb.pushProduct.import',
        timeoutMs: 45_000,
      });

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
          attributeKeys: Object.keys(attributes),
          requestBody: body,
          requestMeta: {
            method: 'POST',
            url: importUrl,
            action: 'products.import',
            contentType: 'multipart/form-data',
            fileField: 'file',
            responseStatus: res.status,
          },
        },
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      if (err instanceof MarketplaceHttpError) {
        this.logger.warn(
          `Hepsiburada Ürün gönderimi: ${err.message} (mpop=${mpop})`,
        );
        throw new BadRequestException({
          message: `Hepsiburada Ürün gönderimi: ${err.message}`,
          hepsiburadaStatus: err.status,
          hepsiburadaBody: err.body,
          requestBody: body,
          requestMeta: {
            method: 'POST',
            url: importUrl,
            action: 'products.import',
            contentType: 'multipart/form-data',
            fileField: 'file',
            responseStatus: err.status,
          },
          debug: {
            mpopBaseUrl: mpop,
            userAgent: auth['User-Agent'],
            categoryId: resolvedCategoryId,
            merchantSku,
            barcode,
            attributeKeys: Object.keys(attributes),
            attributesPreview: Object.fromEntries(
              Object.entries(attributes).map(([k, v]) => [
                k,
                typeof v === 'string' && v.length > 80 ? `${v.slice(0, 80)}…` : v,
              ]),
            ),
            schemaAttributeCount: schema.length,
            requestBody: body,
            hint:
              'Import multipart file alanı `file` ile gider. Marka HB panel markası mı? Desi(kg)=kargo desisi. Miktar örn. \"100 gr\".',
          },
        });
      }
      throw this.wrap(err, 'Ürün gönderimi');
    }
  }

  /**
   * Leaf kategori attribute şeması — zorunlu alanları önceden görmek için.
   */
  async listCategoryAttributes(
    credentials: Record<string, string>,
    categoryId: string | number,
  ): Promise<{
    categoryId: string | number;
    attributes: HbCategoryAttribute[];
  }> {
    const auth = this.auth(credentials);
    const attributes = await this.fetchCategoryAttributes(auth, categoryId);
    return { categoryId, attributes };
  }

  private async fetchCategoryAttributes(
    auth: { Authorization: string; 'User-Agent': string },
    categoryId: string | number,
  ): Promise<HbCategoryAttribute[]> {
    try {
      const res = await marketplaceFetch<{
        success?: boolean;
        code?: number;
        message?: string | null;
        data?:
          | Array<Record<string, unknown>>
          | {
              baseAttributes?: Array<Record<string, unknown>>;
              attributes?: Array<Record<string, unknown>>;
              variantAttributes?: Array<Record<string, unknown>>;
            };
      }>(
        `${this.mpopBase()}/product/api/categories/${encodeURIComponent(String(categoryId))}/attributes`,
        {
          method: 'GET',
          headers: {
            Authorization: auth.Authorization,
            'User-Agent': auth['User-Agent'],
          },
          label: 'hb.categoryAttributes',
        },
      );

      if (res.data?.success === false) {
        this.logger.warn(
          `HB kategori attributes reddedildi: ${res.data.message} (code=${res.data.code})`,
        );
        return [];
      }

      const out: HbCategoryAttribute[] = [];
      const mapRow = (row: Record<string, unknown>, group?: string) => {
        out.push({
          id:
            typeof row.id === 'string' || typeof row.id === 'number'
              ? row.id
              : undefined,
          name: typeof row.name === 'string' ? row.name : undefined,
          type: typeof row.type === 'string' ? row.type : undefined,
          mandatory:
            typeof row.mandatory === 'boolean' ? row.mandatory : undefined,
          multiValue:
            typeof row.multiValue === 'boolean' ? row.multiValue : undefined,
          group,
        });
      };

      const data = res.data?.data;
      if (Array.isArray(data)) {
        for (const row of data) mapRow(row);
        return out;
      }
      if (data && typeof data === 'object') {
        for (const row of data.baseAttributes || []) mapRow(row, 'base');
        for (const row of data.attributes || []) mapRow(row, 'category');
        for (const row of data.variantAttributes || []) mapRow(row, 'variant');
      }
      return out;
    } catch (err) {
      this.logger.warn(
        `HB kategori attributes alınamadı (${categoryId}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return [];
    }
  }

  /** HB attribute values sayfalı dönebilir; ilk sayfa çoğu zaman 20 satır. */
  private async fetchHbAttributeValuePages(
    auth: { Authorization: string; 'User-Agent': string },
    baseUrl: string,
  ): Promise<{
    rows: Array<Record<string, unknown>>;
    status: number;
    data: unknown;
  }> {
    const headers = {
      Authorization: auth.Authorization,
      'User-Agent': auth['User-Agent'],
    };
    const load = (url: string) =>
      marketplaceFetch<unknown>(url, {
        method: 'GET',
        headers,
        label: 'hb.attributeValues',
      });

    let first;
    try {
      first = await load(`${baseUrl}?page=0&size=1000`);
    } catch {
      first = null;
    }
    if (!first || unwrapHbValueRows(first.data).length === 0) {
      first = await load(baseUrl);
    }

    const rows = unwrapHbValueRows(first.data);
    const seen = new Set(rows.map((row) => hbValueRowKey(row)));
    const continuePaging = rows.length === 1000 || rows.length === 20;

    if (continuePaging) {
      for (let page = 1; page < 40; page += 1) {
        let next;
        try {
          next = await load(`${baseUrl}?page=${page}&size=1000`);
        } catch {
          break;
        }
        const more = unwrapHbValueRows(next.data);
        if (!more.length) break;
        let added = 0;
        for (const row of more) {
          const key = hbValueRowKey(row);
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push(row);
          added += 1;
        }
        if (added === 0 || more.length < 1000) break;
      }
    }

    return { rows, status: first.status, data: first.data };
  }

  /**
   * Enum attribute için izin verilen değeri seç.
   * Dönüş: HB’nin beklediği value (genelde value name) + örnek liste.
   */
  private async resolveEnumAttributeValue(
    auth: { Authorization: string; 'User-Agent': string },
    categoryId: string | number,
    attributeId: string | number,
    candidate: unknown,
    attrLabel?: string,
  ): Promise<{
    value: string | null;
    samples: string[];
    debug?: Record<string, unknown>;
  }> {
    const wantedRaw = String(candidate ?? '').trim();
    const wanted = wantedRaw.toLowerCase().replace(/\s+/g, ' ');
    if (!wanted) return { value: null, samples: [] };

    const baseUrl = `${this.mpopBase()}/product/api/categories/${encodeURIComponent(String(categoryId))}/attribute/${encodeURIComponent(String(attributeId))}/values`;

    try {
      const fetched = await this.fetchHbAttributeValuePages(auth, baseUrl);
      const rows = fetched.rows;
      const samples = rows
        .slice(0, 30)
        .map((r) =>
          String(r.name || r.value || r.externalName || r.id || '').trim(),
        )
        .filter(Boolean);

      const debug = {
        httpStatus: fetched.status,
        rowCount: rows.length,
        dataType: Array.isArray(fetched.data)
          ? 'array'
          : fetched.data && typeof fetched.data === 'object'
            ? Object.keys(fetched.data as object).slice(0, 8)
            : typeof fetched.data,
      };

      if (!rows.length) {
        this.logger.warn(
          `HB enum values boş (${attrLabel || attributeId}) ${JSON.stringify(debug)}`,
        );
        return { value: null, samples: [], debug };
      }

      const norm = (s: string) => normalizeHbEnumLabel(s);
      const wantedN = norm(wanted);
      const wantedGrams = extractGrams(wantedN);

      const scored = rows
        .map((row) => {
          const name = String(row.name || row.value || '').trim();
          const ext = String(row.externalName || '').trim();
          const id = String(row.id || '').trim();
          const labels = [name, ext, id].filter(Boolean);
          const norms = labels.map(norm);
          const exact = norms.some((l) => l === wantedN);
          const compact = (s: string) => s.replace(/\s/g, '');
          const loose = norms.some(
            (l) =>
              compact(l) === compact(wantedN) ||
              l.includes(wantedN) ||
              wantedN.includes(l),
          );
          const labelGrams = extractGrams(norm(name));
          const gramMatch =
            wantedGrams != null &&
            labelGrams != null &&
            wantedGrams === labelGrams;
          // Gramaj adayında "100g" ⊃ "10g" gibi gevşek eşleşme yanlış miktar seçer.
          const looseOk = wantedGrams == null && loose;
          return {
            send: name || ext || id,
            score: exact ? 3 : gramMatch ? 2 : looseOk ? 1 : 0,
          };
        })
        .filter((x) => x.score > 0 && x.send)
        .sort((a, b) => b.score - a.score);

      if (scored[0]) return { value: scored[0].send, samples, debug };

      this.logger.warn(
        `HB enum eşleşmedi (${attrLabel || attributeId}): "${candidate}" — örnekler: ${samples.slice(0, 8).join(', ')}`,
      );
      return { value: null, samples, debug };
    } catch (err) {
      this.logger.warn(
        `HB enum values alınamadı (${attributeId}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        value: null,
        samples: [],
        debug: {
          error: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  /** "250g" / "1kg" → HB `kg` attribute string (kg cinsinden) */
  private weightLabelToKg(weightLabel?: string): string | null {
    if (!weightLabel?.trim()) return null;
    const grams = this.parseGrams(weightLabel);
    if (grams == null || grams <= 0) return null;
    const kg = grams / 1000;
    const s = Number.isInteger(kg) ? String(kg) : String(Number(kg.toFixed(3)));
    return s;
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
    const row: { merchantSku: string; availableStock: number; price?: number } = {
      merchantSku,
      availableStock: Math.max(0, Math.floor(stock)),
    };
    if (price != null && Number.isFinite(price) && price > 0) {
      row.price = price;
    }
    return this.uploadListingInventory(auth, [row], 'hb.pushProduct.stock');
  }

  /**
   * Listing stok/fiyat: PUT /sku/{sku} yok (404).
   * Fiyat varsa inventory-uploads, yalnız stoksa stock-uploads.
   */
  private async uploadListingInventory(
    auth: {
      merchantId: string;
      Authorization: string;
      'User-Agent': string;
    },
    rows: Array<{ merchantSku: string; availableStock: number; price?: number }>,
    label: string,
  ) {
    const withPrice = rows.some((row) => row.price != null && row.price > 0);
    const path = withPrice ? 'inventory-uploads' : 'stock-uploads';
    const res = await marketplaceFetch(
      `${this.listingBase()}/listings/merchantid/${encodeURIComponent(auth.merchantId)}/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: auth.Authorization,
          'User-Agent': auth['User-Agent'],
        },
        body: rows,
        label,
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

type HbCategoryAttribute = {
  id?: string | number;
  name?: string;
  type?: string;
  mandatory?: boolean;
  multiValue?: boolean;
  group?: string;
};

function resolveHbAttributeValue(
  attr: HbCategoryAttribute,
  bag: Record<string, unknown>,
): unknown {
  const keys = [
    attr.id != null ? String(attr.id) : '',
    attr.name || '',
    // Bilinen Türkçe → id köprüleri
    ...(attr.name === 'Desi' ? ['kg', 'Desi', 'desi'] : []),
    ...(attr.name === 'Miktar' ? ['00001STC', 'Miktar', 'miktar', 'weightLabel'] : []),
    ...(attr.name === 'Paket Görseli (ön)'
      ? ['00000MU', 'Image1', 'Görsel1']
      : []),
    ...(attr.name === 'KDV' ? ['tax_vat_rate', 'KDV'] : []),
    ...(attr.name === 'Garanti Süresi (Ay)' ? ['GarantiSuresi'] : []),
    ...(attr.name === 'Satıcı Stok Kodu' ? ['merchantSku'] : []),
    ...(attr.name === 'Ürün Adı' ? ['UrunAdi'] : []),
    ...(attr.name === 'Ürün Açıklaması' ? ['UrunAciklamasi'] : []),
    ...(attr.name === 'Barkod' ? ['Barcode'] : []),
    ...(attr.name === 'Görsel1' ? ['Image1'] : []),
    ...(attr.name === 'Fiyat' ? ['price', 'Fiyat'] : []),
    ...(attr.name === 'Stok' ? ['stock', 'Stok'] : []),
    ...(attr.name === 'Varyant Grup Id' ? ['VaryantGroupID'] : []),
  ].filter(Boolean);

  for (const key of keys) {
    const v = bag[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function coerceHbAttributeValue(value: unknown, type?: string): unknown {
  if (type === 'integer') {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : value;
  }
  if (type === 'string' || type === 'media' || type === 'video') {
    return String(value);
  }
  // enum + diğerleri: string tercih
  if (typeof value === 'number') return String(value);
  return value;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function extractGrams(normalized: string): number | null {
  const m = normalized.match(/^([\d.,]+)\s*g$/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** "100g" / "100 gr" / "1 kg" → karşılaştırılabilir "100g" / "1000g". */
function normalizeHbEnumLabel(s: string): string {
  let t = s.toLowerCase().replace(/\s+/g, ' ').trim();
  const toGrams = (raw: string, factor: number) => {
    const n = Number(String(raw).replace(',', '.')) * factor;
    return Number.isFinite(n) ? `${Math.round(n)}g` : raw;
  };
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*kg\b/g, (_, n) => toGrams(n, 1000));
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*gr(am)?s?\b/g, (_, n) => toGrams(n, 1));
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*g\b/g, (_, n) => toGrams(n, 1));
  return t.trim();
}

function hbValueRowKey(row: Record<string, unknown>): string {
  return String(row.id || row.value || row.name || JSON.stringify(row));
}

/** HB values endpoint farklı zarflar döndürebilir */
function unwrapHbValueRows(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) {
    return data.filter(
      (x): x is Record<string, unknown> => !!x && typeof x === 'object',
    );
  }
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  for (const key of ['data', 'content', 'items', 'values', 'attributeValues']) {
    const v = obj[key];
    if (Array.isArray(v)) {
      return v.filter(
        (x): x is Record<string, unknown> => !!x && typeof x === 'object',
      );
    }
    if (v && typeof v === 'object') {
      const nested = v as Record<string, unknown>;
      for (const k2 of ['data', 'content', 'items', 'values']) {
        const arr = nested[k2];
        if (Array.isArray(arr)) {
          return arr.filter(
            (x): x is Record<string, unknown> => !!x && typeof x === 'object',
          );
        }
      }
    }
  }
  return [];
}

/** SIT values API boşken yaygın Miktar formatı: "100 gr" / "1 kg" */
function guessMiktarEnumValue(candidate: unknown): string | null {
  const raw = String(candidate ?? '').trim();
  if (!raw) return null;
  const m = raw
    .toLowerCase()
    .replace(',', '.')
    .match(/^([\d.]+)\s*(kg|g|gr|gram)?$/i);
  if (!m) return null;
  let grams = Number(m[1]);
  if (!Number.isFinite(grams) || grams <= 0) return null;
  const unit = (m[2] || 'g').toLowerCase();
  if (unit === 'kg') grams = grams * 1000;
  if (grams >= 1000) {
    const kg = grams / 1000;
    return Number.isInteger(kg) ? `${kg} kg` : `${Number(kg.toFixed(2))} kg`;
  }
  // HB gıda kategorilerinde çoğu zaman "100 gr" (g değil)
  return `${Math.round(grams)} gr`;
}

function normalizeHbAttrMap(
  raw: Record<string, string | number | boolean> | null | undefined,
): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
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
