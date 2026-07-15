import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  MarketplaceAccount,
  MarketplacePlatform,
} from '@entities/marketplace-account.entity';
import { MarketplaceListing } from '@entities/marketplace-listing.entity';
import { MarketplaceOrder } from '@entities/marketplace-order.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import { IMarketplaceAdapter } from '@modules/marketplace/adapters/marketplace.adapter';
import {
  TrendyolAdapter,
  HepsiburadaAdapter,
  N11Adapter,
} from '@modules/marketplace/adapters/providers';
import {
  CreateMarketplaceAccountDto,
  UpdateMarketplaceAccountDto,
  SyncMarketplaceDto,
  PushMarketplaceProductDto,
} from '@modules/marketplace/dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
  private readonly adapters: Map<MarketplacePlatform, IMarketplaceAdapter>;

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    trendyol: TrendyolAdapter,
    hepsiburada: HepsiburadaAdapter,
    n11: N11Adapter,
  ) {
    this.adapters = new Map<MarketplacePlatform, IMarketplaceAdapter>([
      [MarketplacePlatform.TRENDYOL, trendyol],
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

  async listAccounts(): Promise<MarketplaceAccount[]> {
    return this.em.find(MarketplaceAccount, {
      order: { createdAt: 'DESC' },
    });
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
    return this.em.save(account);
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
    Object.assign(account, dto);
    return this.em.save(account);
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

  async syncAccount(id: string, dto: SyncMarketplaceDto = {}) {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id },
      relations: { listings: true },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }

    const adapter = this.getAdapter(account.platform);
    const mode = dto.mode || 'all';
    const result: Record<string, unknown> = {};

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
      const stockResult = await adapter.syncStock(account.credentials, items);
      for (const listing of listings) {
        listing.lastSyncedStock =
          listing.variant?.stock ?? listing.product?.stock ?? 0;
        await this.em.save(listing);
      }
      result.stock = stockResult;
    }

    if (mode === 'orders' || mode === 'all') {
      const pulled = await adapter.pullOrders(account.credentials);
      for (const order of pulled.orders) {
        const existing = await this.em.findOne(MarketplaceOrder, {
          where: {
            accountId: account.id,
            externalOrderId: order.externalOrderId,
          },
        });
        if (!existing) {
          const row = this.em.create(MarketplaceOrder, {
            accountId: account.id,
            externalOrderId: order.externalOrderId,
            externalStatus: order.externalStatus,
            payload: order.payload,
          });
          await this.em.save(row);
        }
      }
      result.orders = pulled;
    }

    account.lastSyncAt = new Date();
    account.lastSyncStatus = 'success';
    await this.em.save(account);

    return { accountId: account.id, ...result };
  }

  async pushProduct(accountId: string, dto: PushMarketplaceProductDto) {
    const account = await this.em.findOne(MarketplaceAccount, {
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Pazar yeri hesabı bulunamadı');
    }
    const product = await this.em.findOne(Product, {
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    let stock = product.stock;
    let sku: string | undefined;
    let price = product.basePrice;
    if (dto.variantId) {
      const variant = await this.em.findOne(ProductVariant, {
        where: { id: dto.variantId, productId: product.id },
      });
      if (!variant) {
        throw new NotFoundException('Varyant bulunamadı');
      }
      stock = variant.stock;
      sku = variant.sku;
      price = variant.price;
    }

    const adapter = this.getAdapter(account.platform);
    const pushed = await adapter.pushProduct(account.credentials, {
      productId: product.id,
      name: product.name,
      price,
      stock,
      sku,
      description: product.shortDescription || product.description,
    });

    const listing = this.em.create(MarketplaceListing, {
      accountId: account.id,
      productId: product.id,
      variantId: dto.variantId ?? null,
      externalListingId: pushed.externalListingId,
      externalSku: sku ?? null,
      syncStock: true,
      lastSyncedStock: stock,
      isActive: true,
    });
    await this.em.save(listing);
    return { listing, pushed };
  }
}
