import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketplacePlatform } from '@entities/marketplace-account.entity';
import {
  IMarketplaceAdapter,
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

@Injectable()
export class TrendyolGoMarketAdapter implements IMarketplaceAdapter {
  readonly platform = MarketplacePlatform.TRENDYOL_GO_MARKET;
  private readonly logger = new Logger(TrendyolGoMarketAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    return (
      this.config.get<string>('marketplace.trendyolGoMarket.baseUrl') ||
      'https://stageapi.tgoapis.com'
    ).replace(/\/$/, '');
  }

  private authHeaders(credentials: Record<string, string>): Record<
    string,
    string
  > {
    const { apiKey, apiSecret, sellerId } = requireCreds(
      credentials,
      ['apiKey', 'apiSecret', 'sellerId'],
      'Trendyol Go Market',
    );
    const headers: Record<string, string> = {
      Authorization: basicAuthHeader(apiKey, apiSecret),
      'User-Agent': `${sellerId} - KilicCoffeeRoaster`,
      'x-agentname':
        credentials.integratorName?.trim() || 'KilicCoffeeRoaster',
      'x-executor-user':
        credentials.executorEmail?.trim() ||
        'integration@kiliccofferoaster.local',
      sellerId,
      storeId: credentials.storeId?.trim() || '',
    };
    const token = credentials.token?.trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async syncStock(
    credentials: Record<string, string>,
    items: SyncStockItem[],
  ) {
    if (!hasMarketplaceCredentials(credentials)) {
      return {
        synced: items.length,
        ...asMockNoCredentials('Trendyol Go Market'),
        raw: { mock: true, items: items.map((i) => i.externalListingId) },
      };
    }

    const headers = this.authHeaders(credentials);
    const storeId = headers.storeId;
    if (!storeId) {
      return {
        synced: 0,
        mock: false,
        stub: false,
        message:
          'Stok sync için credentials içinde storeId (şube ID) gerekli.',
        raw: { error: 'missing_storeId' },
      };
    }

    const sellerId = headers.sellerId;
    const payload = {
      items: items.map((item) => ({
        barcode: item.externalListingId || item.sku,
        quantity: Math.max(0, Math.floor(item.stock)),
      })),
    };

    try {
      const res = await marketplaceFetch<{ batchRequestId?: string }>(
        `${this.baseUrl()}/integrator/product/grocery/suppliers/${sellerId}/stores/${storeId}/products/price-and-inventory`,
        {
          method: 'POST',
          headers: {
            Authorization: headers.Authorization,
            'User-Agent': headers['User-Agent'],
            'x-agentname': headers['x-agentname'],
            'x-executor-user': headers['x-executor-user'],
          },
          body: payload,
          label: 'trendyolGoMarket.syncStock',
        },
      );
      return {
        synced: items.length,
        mock: false,
        stub: false,
        message: `Stok güncelleme kuyruğa alındı (batch: ${res.data?.batchRequestId || '—'})`,
        raw: res.data as Record<string, unknown>,
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
            externalOrderId: `MOCK-TGO-MARKET-${Date.now()}`,
            externalStatus: 'Created',
            payload: { mock: true, platform: this.platform },
          },
        ] as PulledOrder[],
        ...asMockNoCredentials('Trendyol Go Market'),
      };
    }

    const headers = this.authHeaders(credentials);
    const sellerId = headers.sellerId;
    const storeId = headers.storeId;
    if (!storeId) {
      throw new MarketplaceHttpError(
        'Sipariş çekme için credentials içinde storeId (şube ID) gerekli.',
        400,
        null,
      );
    }

    const endDate = Date.now();
    const startDate = endDate - 7 * 24 * 60 * 60 * 1000;
    const qs = new URLSearchParams({
      storeId,
      page: '0',
      size: '50',
      sortDirection: 'DESC',
      packageModificationStartDate: String(startDate),
      packageModificationEndDate: String(endDate),
    });

    try {
      const res = await marketplaceFetch<{
        content?: Array<Record<string, unknown>>;
      }>(
        `${this.baseUrl()}/integrator/order/grocery/suppliers/${sellerId}/packages?${qs}`,
        {
          method: 'GET',
          headers: {
            Authorization: headers.Authorization,
            'User-Agent': headers['User-Agent'],
            'x-agentname': headers['x-agentname'],
            'x-executor-user': headers['x-executor-user'],
          },
          label: 'trendyolGoMarket.pullOrders',
        },
      );

      const content = res.data?.content || [];
      const orders: PulledOrder[] = content.map((pkg) => {
        const id =
          String(
            pkg.id ??
              pkg.orderNumber ??
              pkg.orderId ??
              pkg.packageId ??
              '',
          ) || `tgo-${Date.now()}`;
        return {
          externalOrderId: id,
          externalStatus: String(
            pkg.packageStatus || pkg.status || 'Unknown',
          ),
          payload: pkg,
        };
      });

      return {
        orders,
        mock: false,
        stub: false,
        message: `${orders.length} sipariş paketi çekildi`,
      };
    } catch (err) {
      throw this.wrap(err, 'Sipariş çekme');
    }
  }

  async pushProduct(
    credentials: Record<string, string>,
    input: PushProductInput,
  ): Promise<PushProductResult> {
    if (!hasMarketplaceCredentials(credentials)) {
      const externalListingId = `tgo-mock-${input.productId.slice(0, 8)}-${Date.now()}`;
      return {
        externalListingId,
        mock: true,
        stub: false,
        message: 'Credentials yok — listing ID simüle edildi',
        rawResponse: { mock: true, input },
      };
    }

    const brandId = credentials.brandId;
    const categoryId = credentials.categoryId;
    if (!brandId?.trim() || !categoryId?.trim()) {
      return {
        externalListingId: '',
        mock: false,
        stub: false,
        message:
          'Ürün gönderimi için credentials içinde brandId ve categoryId gerekli (Go Market kategori/marka eşlemesi).',
        rawResponse: {
          error: 'missing_brand_or_category',
          hint: 'Admin credentials JSON: brandId, categoryId ekleyin',
        },
      };
    }

    const headers = this.authHeaders(credentials);
    const sellerId = headers.sellerId;
    const barcode = (input.sku || input.productId).slice(0, 40);
    const price = Number(input.price) || 0;

    const body = {
      items: [
        {
          barcode,
          title: input.name.slice(0, 100),
          productMainId: input.productId.slice(0, 40),
          brandId: Number(brandId),
          categoryId: Number(categoryId),
          quantity: Math.max(0, Math.floor(input.stock)),
          stockCode: (input.sku || barcode).slice(0, 100),
          dimensionalWeight: Number(credentials.dimensionalWeight || 1),
          description: input.description || input.name,
          currencyType: 'TRY',
          listPrice: price,
          salePrice: price,
          vatRate: Number(credentials.vatRate || 20),
          images: credentials.imageUrl
            ? [{ url: credentials.imageUrl }]
            : undefined,
          attributes: [],
          storeId: headers.storeId ? Number(headers.storeId) : undefined,
        },
      ],
    };

    try {
      const res = await marketplaceFetch<Record<string, unknown>>(
        `${this.baseUrl()}/integrator/product/grocery/suppliers/${sellerId}/products`,
        {
          method: 'POST',
          headers: {
            Authorization: headers.Authorization,
            'User-Agent': headers['User-Agent'],
            'x-agentname': headers['x-agentname'],
            'x-executor-user': headers['x-executor-user'],
          },
          body,
          label: 'trendyolGoMarket.pushProduct',
        },
      );
      return {
        externalListingId: barcode,
        mock: false,
        stub: false,
        message:
          'Ürün oluşturma isteği Trendyol Go Market kuyruğuna gönderildi (barcode = externalListingId)',
        rawResponse: res.data as Record<string, unknown>,
      };
    } catch (err) {
      throw this.wrap(err, 'Ürün gönderimi');
    }
  }

  private wrap(err: unknown, action: string): never {
    if (err instanceof MarketplaceHttpError) {
      this.logger.warn(`Trendyol Go Market ${action}: ${err.message}`);
      throw err;
    }
    throw err;
  }
}
