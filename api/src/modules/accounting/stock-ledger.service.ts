import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import {
  StockMovement,
  StockMovementType,
} from '@entities/stock-movement.entity';
import {
  CreateStockMovementDto,
  StockMovementQueryDto,
} from '@modules/accounting/dto/accounting.dto';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';

@Injectable()
export class StockLedgerService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async list(
    query: StockMovementQueryDto,
  ): Promise<PaginatedResult<StockMovement>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 200) : 50;
    const qb = this.em
      .createQueryBuilder(StockMovement, 'm')
      .leftJoinAndSelect('m.product', 'product')
      .leftJoinAndSelect('m.variant', 'variant');
    if (query.productId) {
      qb.andWhere('m.product_id = :productId', { productId: query.productId });
    }
    if (query.variantId) {
      qb.andWhere('m.variant_id = :variantId', { variantId: query.variantId });
    }
    qb.orderBy('m.created_at', 'DESC');
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginateResult(items, total, page, limit);
  }

  async create(dto: CreateStockMovementDto): Promise<StockMovement> {
    return this.record({
      productId: dto.productId ?? null,
      variantId: dto.variantId ?? null,
      type: dto.type,
      quantity: dto.quantity,
      note: dto.note ?? null,
      clientId: dto.clientId ?? null,
      source: 'manual',
    });
  }

  async record(input: {
    productId?: string | null;
    variantId?: string | null;
    type: StockMovementType;
    quantity: number;
    source?: string | null;
    sourceId?: string | null;
    note?: string | null;
    clientId?: string | null;
  }): Promise<StockMovement> {
    if (!input.productId && !input.variantId) {
      throw new BadRequestException('Ürün veya varyant gerekli');
    }

    return this.em.transaction(async (tx) => {
      let productId = input.productId ?? null;
      let balanceAfter = 0;

      if (input.variantId) {
        const variant = await tx.findOne(ProductVariant, {
          where: { id: input.variantId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!variant) throw new NotFoundException('Varyant bulunamadı');
        productId = variant.productId;
        if (input.type === StockMovementType.COUNT) {
          variant.stock = input.quantity;
        } else {
          variant.stock = Math.max(
            0,
            Math.round((variant.stock + input.quantity) * 1000) / 1000,
          );
        }
        await tx.save(variant);
        balanceAfter = variant.stock;
        await this.syncProductStock(tx, variant.productId);
      } else if (input.productId) {
        const product = await tx.findOne(Product, {
          where: { id: input.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) throw new NotFoundException('Ürün bulunamadı');
        if (input.type === StockMovementType.COUNT) {
          product.stock = input.quantity;
        } else {
          product.stock = Math.max(
            0,
            Math.round((product.stock + input.quantity) * 1000) / 1000,
          );
        }
        await tx.save(product);
        balanceAfter = product.stock;
      }

      const movement = tx.create(StockMovement, {
        productId,
        variantId: input.variantId ?? null,
        type: input.type,
        quantity: input.quantity,
        balanceAfter,
        source: input.source ?? null,
        sourceId: input.sourceId ?? null,
        note: input.note ?? null,
        clientId: input.clientId ?? null,
      });
      return tx.save(movement);
    });
  }

  async snapshot() {
    const variants = await this.em.find(ProductVariant, {
      relations: { product: true },
      order: { sku: 'ASC' },
    });
    return variants.map((v) => ({
      variantId: v.id,
      productId: v.productId,
      sku: v.sku,
      name: v.product?.name,
      label: v.weightLabel,
      stock: v.stock,
      kind: v.product?.kind,
      unit: v.product?.unit,
      vatRate: v.product?.vatRate,
      barcode: v.barcode || v.product?.barcode || null,
      expiresAt: v.expiresAt || v.product?.expiresAt || null,
    }));
  }

  private async syncProductStock(
    tx: EntityManager,
    productId: string,
  ): Promise<void> {
    const variants = await tx.find(ProductVariant, { where: { productId } });
    const product = await tx.findOne(Product, { where: { id: productId } });
    if (!product) return;
    product.stock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    await tx.save(product);
  }
}
