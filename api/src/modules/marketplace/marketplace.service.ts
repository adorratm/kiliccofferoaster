import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  MarketplaceAccount,
  MarketplacePlatform,
} from '@entities/marketplace-account.entity';
import { MarketplaceListing } from '@entities/marketplace-listing.entity';
import { MarketplaceOrder } from '@entities/marketplace-order.entity';
import { OrderStatus } from '@entities/order.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import { IMarketplaceAdapter } from '@modules/marketplace/adapters/marketplace.adapter';
import {
  TrendyolAdapter,
  TrendyolGoMarketAdapter,
  HepsiburadaAdapter,
  N11Adapter,
} from '@modules/marketplace/adapters/providers';
import {
  CreateMarketplaceAccountDto,
  UpdateMarketplaceAccountDto,
  SyncMarketplaceDto,
  PushMarketplaceProductDto,
} from '@modules/marketplace/dto/marketplace.dto';
import {
  mapExternalStatus,
  MarketplaceOrderImportService,
  shouldApplyMarketplaceStatus,
} from '@modules/marketplace/marketplace-order-import.service';

function maskCredentials(
  credentials: Record<string, string> | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials || {})) {
    if (!value) {
      out[key] = '';
      continue;
    }
    out[key] = value.length <= 4 ? '****' : `****${value.slice(-4)}`;
  }
  return out;
}

function looksMasked(value: string): boolean {
  return value.includes('****') || /^\*+$/.test(value);
}

/** Maskeli / boş değerleri mevcut credential’ların üzerine yazmaz */
function mergeCredentials(
  existing: Record<string, string> | null | undefined,
  incoming: Record<string, string> | null | undefined,
): Record<string, string> {
  const next: Record<string, string> = { ...(existing || {}) };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed || looksMasked(trimmed)) continue;
    next[key] = trimmed;
  }
  return next;
}

@Injectable()
export class MarketplaceService {
  private readonly adapters: Map<MarketplacePlatform, IMarketplaceAdapter>;
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly orderImport: MarketplaceOrderImportService,
    private readonly config: ConfigService,
    trendyol: TrendyolAdapter,
    hepsiburada: HepsiburadaAdapter,
    n11: N11Adapter,
    trendyolGoMarket: TrendyolGoMarketAdapter,
  ) {
    this.adapters = new Map<MarketplacePlatform, IMarketplaceAdapter>([
      [MarketplacePlatform.TRENDYOL, trendyol],
      [MarketplacePlatform.TRENDYOL_GO_MARKET, trendyolGoMarket],
      [MarketplacePlatform.HEPSIBURADA, hepsiburada],
      [MarketplacePlatform.N11, n11],
    ]);
  }

  private getAdapter(platform: MarketplacePlatform): IMarketplaceAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new BadRequestException(`Desteklenmeyen platform: ${platform}`);
    }
    return adapter;
  }

  private sanitize(account: MarketplaceAccount): MarketplaceAccount {
    return {
      ...account,
      credentials: maskCredentials(account.credentials),
    } as MarketplaceAccount;
  }

  async listAccounts(): Promise<MarketplaceAccount[]> {
    const rows = await this.em.find(MarketplaceAccount, {
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.sanitize(r));
  }

  async createAccount(
    dto: CreateMarketplaceAccountDto,
  ): Promise<MarketplaceAccount> {
    const account = this.em.create(MarketplaceAccount, {
      platform: dto.platform,
      storeName: dto.storeName,
      isEnabled: dto.isEnabled ?? false,
      credentials: dto.credentials ?? {},
    });
    const saved = await this.em.save(account);
    return this.sanitize(saved);
  }

  async updateAccount(
    id: string,
    dto: UpdateMarketplaceAccountDto,
  ): Promise<MarketplaceAccount> {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    if (dto.platform !== undefined) account.platform = dto.platform;
    if (dto.storeName !== undefined) account.storeName = dto.storeName;
    if (dto.isEnabled !== undefined) account.isEnabled = dto.isEnabled;
    if (dto.credentials !== undefined) {
      account.credentials = mergeCredentials(
        account.credentials,
        dto.credentials,
      );
    }
    const saved = await this.em.save(account);
    return this.sanitize(saved);
  }

  async removeAccount(id: string): Promise<void> {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    await this.em.remove(account);
  }

  async listListings(accountId: string): Promise<MarketplaceListing[]> {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    return this.em.find(MarketplaceListing, {
      where: { accountId },
      relations: { product: true, variant: true },
      order: { createdAt: 'DESC' },
    });
  }

  async listOrders(accountId: string): Promise<MarketplaceOrder[]> {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    return this.em.find(MarketplaceOrder, {
      where: { accountId },
      relations: { internalOrder: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async importMarketplaceOrder(marketplaceOrderId: string) {
    const mOrder = await this.em.findOne(MarketplaceOrder, {
      where: { id: marketplaceOrderId },
    });
    if (!mOrder) {
      throw new NotFoundException('Pazaryeri siparişi bulunamadı');
    }
    const result = await this.orderImport.importIfNeeded(marketplaceOrderId);
    if (result.reason === 'not_found') {
      throw new NotFoundException('Pazaryeri siparişi bulunamadı');
    }
    return {
      marketplaceOrderId,
      externalOrderId: mOrder.externalOrderId,
      ...result,
    };
  }

  async listHepsiburadaCategoryAttributes(
    accountId: string,
    categoryId: string,
  ) {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    if (account.platform !== MarketplacePlatform.HEPSIBURADA) {
      throw new BadRequestException('Bu endpoint yalnızca Hepsiburada için');
    }
    const adapter = this.getAdapter(account.platform) as HepsiburadaAdapter;
    if (typeof adapter.listCategoryAttributes !== 'function') {
      throw new BadRequestException('Hepsiburada attribute listesi desteklenmiyor');
    }
    return adapter.listCategoryAttributes(account.credentials, categoryId);
  }

  async importPendingOrders(accountId: string) {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    const result = await this.orderImport.importPendingForAccount(accountId);
    return { accountId, ...result };
  }

  async syncAccount(id: string, dto: SyncMarketplaceDto = {}) {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id },
      relations: { listings: true },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    if (!account.isEnabled) {
      throw new BadRequestException('Hesap pasif — senkronizasyon kapalı');
    }

    const dryRun = dto.dryRun === true;
    const adapter = this.getAdapter(account.platform);
    const mode = dto.mode || 'all';
    const result: Record<string, unknown> = { dryRun };

    try {
      if (mode === 'stock' || mode === 'all') {
        const listings = await this.em.find(MarketplaceListing, {
          where: { accountId: account.id, syncStock: true, isActive: true },
          relations: { product: true, variant: true },
        });
        const items = listings.map((l) => ({
          externalListingId: l.externalListingId,
          stock: l.variant?.stock ?? l.product?.stock ?? 0,
          sku: l.externalSku || undefined,
        }));
        const stockResult = await adapter.syncStock(
          account.credentials,
          items,
        );
        if (!dryRun) {
          for (const listing of listings) {
            listing.lastSyncedStock =
              listing.variant?.stock ?? listing.product?.stock ?? 0;
            await this.em.save(listing);
          }
        }
        result.stock = stockResult;
      }

      if (mode === 'orders' || mode === 'all') {
        const pulled = await adapter.pullOrders(account.credentials);
        let inserted = 0;
        let imported = 0;
        if (!dryRun) {
          for (const order of pulled.orders) {
            let row = await this.em.findOne(MarketplaceOrder, {
              where: {
                accountId: account.id,
                externalOrderId: order.externalOrderId,
              },
            });
            if (!row) {
              row = this.em.create(MarketplaceOrder, {
                accountId: account.id,
                externalOrderId: order.externalOrderId,
                externalStatus: order.externalStatus,
                payload: order.payload,
              });
              await this.em.save(row);
              inserted += 1;
            } else {
              row.externalStatus = order.externalStatus;
              row.payload = order.payload;
              await this.em.save(row);
            }

            const imp = await this.orderImport.importIfNeeded(row.id);
            if (imp.imported) imported += 1;
          }
        }
        result.orders = {
          ...pulled,
          inserted: dryRun ? 0 : inserted,
          imported: dryRun ? 0 : imported,
        };
      }

      if (!dryRun) {
        account.lastSyncAt = new Date();
        account.lastSyncStatus = 'success';
        await this.em.save(account);
      }

      return {
        accountId: account.id,
        dryRun,
        status: 'success' as const,
        ...result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!dryRun) {
        account.lastSyncAt = new Date();
        account.lastSyncStatus = 'error';
        await this.em.save(account);
      }
      throw new BadRequestException({
        message: `Senkron başarısız: ${message}`,
        accountId: account.id,
        status: 'error',
        dryRun,
      });
    }
  }

  async pushProduct(accountId: string, dto: PushMarketplaceProductDto) {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    if (!account.isEnabled) {
      throw new BadRequestException('Hesap pasif — ürün gönderimi kapalı');
    }
    const product = await this.em.findOne(Product, {
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    const adapter = this.getAdapter(account.platform);
    const imageUrl =
      product.imageUrl ||
      (Array.isArray(product.gallery) && product.gallery[0]) ||
      undefined;

    type PushTarget = {
      variantId: string | null;
      sku?: string;
      barcode?: string;
      weightLabel?: string;
      grindOption?: string;
      roastOption?: string;
      price: string;
      stock: number;
    };

    const targets: PushTarget[] = [];

    if (dto.variantId) {
      const variant = await this.em.findOne(ProductVariant, {
        where: { id: dto.variantId, productId: product.id },
      });
      if (!variant) {
        throw new NotFoundException('Varyant bulunamadı');
      }
      targets.push({
        variantId: variant.id,
        sku: variant.sku,
        barcode: variant.barcode || undefined,
        weightLabel: variant.weightLabel,
        grindOption: variant.grindOption || undefined,
        roastOption: variant.roastOption || undefined,
        price: variant.price,
        stock: variant.stock,
      });
    } else if (account.platform === MarketplacePlatform.HEPSIBURADA) {
      // HB: aktif varyantların her biri ayrı merchantSku + aynı VaryantGroupID
      const variants = await this.em.find(ProductVariant, {
        where: { productId: product.id, isActive: true },
        order: { weightLabel: 'ASC' },
      });
      if (variants.length > 0) {
        for (const variant of variants) {
          targets.push({
            variantId: variant.id,
            sku: variant.sku,
            barcode: variant.barcode || undefined,
            weightLabel: variant.weightLabel,
            grindOption: variant.grindOption || undefined,
            roastOption: variant.roastOption || undefined,
            price: variant.price,
            stock: variant.stock,
          });
        }
      } else {
        targets.push({
          variantId: null,
          sku: undefined,
          price: product.basePrice,
          stock: product.stock,
        });
      }
    } else {
      targets.push({
        variantId: null,
        sku: undefined,
        price: product.basePrice,
        stock: product.stock,
      });
    }

    const results: Array<{
      variantId: string | null;
      sku?: string;
      weightLabel?: string;
      pushed: Awaited<ReturnType<IMarketplaceAdapter['pushProduct']>>;
      listing: MarketplaceListing | null;
      error?: string;
    }> = [];

    for (const target of targets) {
      try {
        const pushed = await adapter.pushProduct(account.credentials, {
          productId: product.id,
          name: product.name,
          price: target.price,
          stock: target.stock,
          sku: target.sku,
          description: product.shortDescription || product.description,
          imageUrl: imageUrl || undefined,
          hepsiburadaCategoryId: product.hepsiburadaCategoryId || undefined,
          weightLabel: target.weightLabel,
          grindOption: target.grindOption,
          roastOption: target.roastOption,
          barcode: target.barcode,
          varyantGroupId: product.id,
        });

        if (dto.dryRun || pushed.skipped || !pushed.externalListingId) {
          results.push({
            variantId: target.variantId,
            sku: target.sku,
            weightLabel: target.weightLabel,
            pushed,
            listing: null,
          });
          continue;
        }

        const listing = await this.upsertListing({
          accountId: account.id,
          productId: product.id,
          variantId: target.variantId,
          externalListingId: pushed.externalListingId,
          externalSku: target.sku ?? null,
          stock: target.stock,
        });
        results.push({
          variantId: target.variantId,
          sku: target.sku,
          weightLabel: target.weightLabel,
          pushed,
          listing,
        });
      } catch (err) {
        const message =
          err instanceof BadRequestException
            ? typeof err.getResponse() === 'string'
              ? String(err.getResponse())
              : String(
                  (err.getResponse() as { message?: string })?.message ||
                    err.message,
                )
            : err instanceof Error
              ? err.message
              : String(err);
        this.logger.warn(
          `pushProduct variant failed sku=${target.sku || '-'} weight=${target.weightLabel || '-'}: ${message}`,
        );
        results.push({
          variantId: target.variantId,
          sku: target.sku,
          weightLabel: target.weightLabel,
          pushed: {
            externalListingId: '',
            mock: false,
            stub: false,
            message,
            rawResponse:
              err instanceof BadRequestException &&
              typeof err.getResponse() === 'object'
                ? (err.getResponse() as Record<string, unknown>)
                : { error: message },
          },
          listing: null,
          error: message,
        });
      }
    }

    if (!results.length) {
      throw new BadRequestException(
        'Gönderilecek aktif varyant bulunamadı. Üründe isActive=true varyant olmalı.',
      );
    }

    const first = results.find((r) => r.listing || r.pushed.mock) || results[0];
    const pushedSummary = first?.pushed;
    const skippedAll = results.every((r) => r.pushed.skipped);
    const okCount = results.filter((r) => r.listing || r.pushed.mock).length;
    const failCount = results.filter((r) => Boolean(r.error)).length;
    const emptyCount = results.filter(
      (r) =>
        !r.error &&
        !r.pushed.skipped &&
        !r.listing &&
        !r.pushed.mock &&
        !dto.dryRun &&
        !r.pushed.externalListingId,
    ).length;

    const variantSummary = results
      .map((r) => {
        const label = [r.sku, r.weightLabel].filter(Boolean).join(' · ') || 'SKU?';
        if (r.error) return `${label}: HATA`;
        if (r.pushed.skipped) return `${label}: atlandı`;
        if (r.listing || r.pushed.mock) return `${label}: OK`;
        return `${label}: başarısız`;
      })
      .join(' | ');

    if (dto.dryRun) {
      return {
        dryRun: true,
        listing: null,
        listings: [],
        pushed: {
          ...pushedSummary,
          message: `Dry-run: ${results.length} aktif varyant → ${variantSummary}`,
          rawResponse: {
            ...(pushedSummary?.rawResponse || {}),
            variantCount: results.length,
            variants: results.map((r) => ({
              variantId: r.variantId,
              sku: r.sku,
              weightLabel: r.weightLabel,
              pushed: r.pushed,
              error: r.error,
            })),
          },
        },
        results,
      };
    }

    if (skippedAll && pushedSummary?.skipped) {
      return {
        dryRun: false,
        listing: null,
        listings: [],
        pushed: {
          ...pushedSummary,
          message: `${pushedSummary.message || 'Atlandı'} (${results.length} varyant)`,
        },
        results,
      };
    }

    if (okCount === 0 && (failCount > 0 || emptyCount > 0)) {
      throw new BadRequestException({
        message:
          pushedSummary?.message ||
          'Hiçbir varyant gönderilemedi — tüm SKU’lar başarısız',
        variantSummary,
        results: results.map((r) => ({
          sku: r.sku,
          weightLabel: r.weightLabel,
          error: r.error,
          message: r.pushed.message,
        })),
      });
    }

    const listings = results
      .map((r) => r.listing)
      .filter((l): l is MarketplaceListing => Boolean(l));

    return {
      dryRun: false,
      listing: listings[0] ?? null,
      listings,
      pushed: {
        ...(pushedSummary || {
          externalListingId: '',
          mock: false,
          rawResponse: {},
        }),
        message:
          results.length > 1
            ? `Hepsiburada: ${okCount}/${results.length} varyant OK` +
              (failCount ? `, ${failCount} hata` : '') +
              ` — ${variantSummary}`
            : pushedSummary?.message,
        rawResponse: {
          ...(pushedSummary?.rawResponse || {}),
          variantCount: results.length,
          okCount,
          failCount,
          variants: results.map((r) => ({
            variantId: r.variantId,
            sku: r.sku,
            weightLabel: r.weightLabel,
            externalListingId: r.pushed.externalListingId,
            skipped: r.pushed.skipped,
            message: r.pushed.message,
            error: r.error,
          })),
        },
      },
      results,
    };
  }

  private async upsertListing(input: {
    accountId: string;
    productId: string;
    variantId: string | null;
    externalListingId: string;
    externalSku: string | null;
    stock: number;
  }): Promise<MarketplaceListing> {
    const qb = this.em
      .createQueryBuilder(MarketplaceListing, 'l')
      .where('l.account_id = :accountId', { accountId: input.accountId })
      .andWhere('l.product_id = :productId', { productId: input.productId });
    if (input.variantId) {
      qb.andWhere('l.variant_id = :variantId', { variantId: input.variantId });
    } else {
      qb.andWhere('l.variant_id IS NULL');
    }
    let listing = await qb.getOne();
    if (!listing) {
      listing = this.em.create(MarketplaceListing, {
        accountId: input.accountId,
        productId: input.productId,
        variantId: input.variantId,
        externalListingId: input.externalListingId,
        externalSku: input.externalSku,
        syncStock: true,
        lastSyncedStock: input.stock,
        isActive: true,
      });
    } else {
      listing.externalListingId = input.externalListingId;
      listing.externalSku = input.externalSku;
      listing.syncStock = true;
      listing.lastSyncedStock = input.stock;
      listing.isActive = true;
    }
    return this.em.save(listing);
  }

  /**
   * İç sipariş shipped olduğunda bağlı pazaryeri siparişine paket/kargo bildir.
   * HepsiJet: createPackages yeterli; diğer kargoda tracking ile intransit.
   */
  async notifyFulfillment(
    internalOrderId: string,
    status: OrderStatus,
  ): Promise<{
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    packageNumber?: string;
    trackingNumber?: string;
    message?: string;
  }> {
    if (status !== OrderStatus.SHIPPED && status !== OrderStatus.DELIVERED) {
      return { ok: true, skipped: true, reason: 'status_not_applicable' };
    }

    const mOrder = await this.em.findOne(MarketplaceOrder, {
      where: { internalOrderId },
      relations: { account: true },
    });
    if (!mOrder?.account) {
      return { ok: true, skipped: true, reason: 'not_marketplace_order' };
    }
    if (!mOrder.account.isEnabled) {
      return { ok: true, skipped: true, reason: 'account_disabled' };
    }

    const adapter = this.getAdapter(mOrder.account.platform);
    if (!adapter.fulfillOrder) {
      return { ok: true, skipped: true, reason: 'adapter_no_fulfill' };
    }

    // Teslim: HepsiJet tarafında HB bildirir; biz sadece shipped'da paketleriz.
    if (status === OrderStatus.DELIVERED) {
      return { ok: true, skipped: true, reason: 'deliver_via_hb' };
    }

    try {
      const result = await adapter.fulfillOrder(mOrder.account.credentials, {
        externalOrderId: mOrder.externalOrderId,
        payload: mOrder.payload || {},
        cargoCompany:
          mOrder.account.credentials.cargoCompany || undefined,
      });

      mOrder.payload = {
        ...(mOrder.payload || {}),
        hbFulfillment: {
          at: new Date().toISOString(),
          packageNumber: result.packageNumber,
          trackingNumber: result.trackingNumber,
          labelUrl: result.labelUrl,
          mock: result.mock,
          raw: result.raw,
        },
        packageNumber: result.packageNumber || mOrder.payload?.packageNumber,
        trackingNumber:
          result.trackingNumber || mOrder.payload?.trackingNumber,
      };
      if (!result.mock) {
        mOrder.externalStatus = mOrder.externalStatus || 'Packaged';
      }
      await this.em.save(mOrder);

      return {
        ok: result.ok,
        packageNumber: result.packageNumber,
        trackingNumber: result.trackingNumber,
        message: result.message,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Marketplace fulfill failed for order ${internalOrderId}: ${message}`,
      );
      mOrder.payload = {
        ...(mOrder.payload || {}),
        hbFulfillmentError: {
          at: new Date().toISOString(),
          message,
        },
      };
      await this.em.save(mOrder);
      return { ok: false, message };
    }
  }

  /**
   * HB merchant webhook: PUT .../packages/{packageNumber}/{event}
   * event: intransit | deliver | undeliver
   */
  async handleHepsiburadaPackageWebhook(
    packageNumber: string,
    event: string,
    body: Record<string, unknown>,
    secret?: string,
  ): Promise<{ ok: boolean; updated: boolean; orderId?: string | null }> {
    this.assertHepsiburadaWebhookSecret(secret);

    const normalized = event.trim().toLowerCase();
    if (!['intransit', 'deliver', 'undeliver'].includes(normalized)) {
      throw new BadRequestException(`Desteklenmeyen HB webhook event: ${event}`);
    }

    const pkg = packageNumber.trim();
    if (!pkg) {
      throw new BadRequestException('packageNumber gerekli');
    }

    const externalStatus =
      normalized === 'deliver'
        ? 'Delivered'
        : normalized === 'intransit'
          ? 'InTransit'
          : 'Undelivered';

    const orderNumber = String(
      body.orderNumber || body.OrderNumber || body.orderId || '',
    ).trim();

    const accounts = await this.em.find(MarketplaceAccount, {
      where: {
        platform: MarketplacePlatform.HEPSIBURADA,
        isEnabled: true,
      },
    });
    if (!accounts.length) {
      return { ok: true, updated: false };
    }

    let mOrder: MarketplaceOrder | null = null;
    for (const account of accounts) {
      if (orderNumber) {
        mOrder = await this.em.findOne(MarketplaceOrder, {
          where: { accountId: account.id, externalOrderId: orderNumber },
          relations: { internalOrder: true, account: true },
        });
        if (mOrder) break;
      }

      mOrder = await this.em
        .createQueryBuilder(MarketplaceOrder, 'm')
        .leftJoinAndSelect('m.internalOrder', 'o')
        .leftJoinAndSelect('m.account', 'a')
        .where('m.account_id = :accountId', { accountId: account.id })
        .andWhere(
          `(m.payload->>'packageNumber' = :pkg
            OR m.payload->'hbFulfillment'->>'packageNumber' = :pkg
            OR m.payload->'package'->>'packageNumber' = :pkg
            OR m.payload->>'PackageNumber' = :pkg)`,
          { pkg },
        )
        .getOne();
      if (mOrder) break;
    }

    if (!mOrder) {
      // Bilinen sipariş yoksa yine 204 benzeri kabul — HB idempotent bekler
      this.logger.warn(
        `HB webhook: paket/sipariş bulunamadı (${pkg}, ${normalized})`,
      );
      return { ok: true, updated: false };
    }

    mOrder.externalStatus = externalStatus;
    mOrder.payload = {
      ...(mOrder.payload || {}),
      ...body,
      packageNumber: pkg,
      webhookEvent: normalized,
      webhookAt: new Date().toISOString(),
    };
    await this.em.save(mOrder);

    if (mOrder.internalOrder) {
      const next = mapExternalStatus(externalStatus);
      const previous = mOrder.internalOrder.status;
      if (shouldApplyMarketplaceStatus(previous, next)) {
        mOrder.internalOrder.status = next;
        if (next === OrderStatus.DELIVERED) {
          mOrder.internalOrder.deliveredAt = new Date();
        }
        await this.em.save(mOrder.internalOrder);
      }
    } else {
      await this.orderImport.importIfNeeded(mOrder.id);
    }

    return {
      ok: true,
      updated: true,
      orderId: mOrder.internalOrderId,
    };
  }

  private assertHepsiburadaWebhookSecret(secret?: string): void {
    const expected = (
      this.config.get<string>('marketplace.hepsiburada.webhookSecret') || ''
    ).trim();
    if (!expected) return;
    const got = (secret || '').trim();
    if (!got || got !== expected) {
      throw new UnauthorizedException('Geçersiz webhook secret');
    }
  }
}
