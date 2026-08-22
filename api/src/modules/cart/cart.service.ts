import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Cart } from '@entities/cart.entity';
import { CartItem } from '@entities/cart-item.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import {
  grindMatchKey,
  resolveGrindOption,
} from '@common/constants/grind-options';
import {
  AddCartItemDto,
  UpdateCartItemDto,
} from '@modules/cart/dto/cart.dto';
import { CampaignsService } from '@modules/campaigns/campaigns.service';

const CART_RELATIONS = {
  items: { product: true, variant: true },
} as const;

@Injectable()
export class CartService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly campaigns: CampaignsService,
  ) {}

  async getOrCreateCart(
    userId?: string | null,
    sessionId?: string | null,
  ): Promise<Cart> {
    if (!userId && !sessionId) {
      throw new BadRequestException(
        'Kullanıcı veya X-Session-Id gerekli',
      );
    }

    if (userId && sessionId) {
      await this.mergeSessionIntoUser(userId, sessionId);
    }

    let cart: Cart | null = null;
    if (userId) {
      const carts = await this.em.find(Cart, {
        where: { userId },
        relations: CART_RELATIONS,
        order: { createdAt: 'DESC' },
        take: 1,
      });
      cart = carts[0] ?? null;
    }
    if (!cart && sessionId) {
      cart = await this.em.findOne(Cart, {
        where: { sessionId },
        relations: CART_RELATIONS,
      });
    }

    if (!cart) {
      cart = this.em.create(Cart, {
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        items: [],
      });
      await this.em.save(cart);
      cart.items = [];
    } else if (userId && !cart.userId) {
      cart.userId = userId;
      await this.em.save(cart);
    }

    return cart;
  }

  /**
   * Misafir (session) sepetini kullanıcı sepetine taşır.
   * Login / OAuth sonrası X-Session-Id ile çağrılır.
   */
  async mergeSessionIntoUser(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const sessionCart = await this.em.findOne(Cart, {
      where: { sessionId },
      relations: CART_RELATIONS,
    });
    if (!sessionCart || sessionCart.userId === userId) return;

    const sessionItems = sessionCart.items || [];
    if (!sessionItems.length) {
      if (!sessionCart.userId) {
        await this.em.remove(sessionCart);
      }
      return;
    }

    const userCarts = await this.em.find(Cart, {
      where: { userId },
      relations: CART_RELATIONS,
      order: { createdAt: 'DESC' },
      take: 1,
    });
    let userCart = userCarts[0] ?? null;

    if (!userCart) {
      sessionCart.userId = userId;
      await this.em.save(sessionCart);
      return;
    }

    if (userCart.id === sessionCart.id) return;

    for (const item of sessionItems) {
      const productKind = item.product?.kind;
      const existing = userCart.items?.find(
        (i) =>
          i.productId === item.productId &&
          (i.variantId ?? null) === (item.variantId ?? null) &&
          grindMatchKey(i.product?.kind, i.grindOption) ===
            grindMatchKey(productKind, item.grindOption),
      );
      if (existing) {
        existing.quantity += item.quantity;
        existing.unitPrice = item.unitPrice;
        await this.em.save(existing);
        await this.em.remove(item);
      } else {
        item.cartId = userCart.id;
        await this.em.save(item);
      }
    }

    await this.em.remove(sessionCart);
    userCart = await this.em.findOneOrFail(Cart, {
      where: { id: userCart.id },
      relations: CART_RELATIONS,
    });
    userCart.sessionId = sessionId;
    await this.em.save(userCart);
  }

  async getCart(userId?: string | null, sessionId?: string | null) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    return this.withTotals(cart);
  }

  async clearCartById(cartId: string | null | undefined): Promise<void> {
    if (!cartId) return;
    const cart = await this.em.findOne(Cart, {
      where: { id: cartId },
      relations: { items: true },
    });
    if (!cart) return;
    if (cart.items?.length) {
      await this.em.remove(cart.items);
    }
    await this.em.remove(cart);
  }

  async addItem(
    dto: AddCartItemDto,
    userId?: string | null,
    sessionId?: string | null,
  ) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const product = await this.em.findOne(Product, {
      where: { id: dto.productId, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    const variants = await this.em.find(ProductVariant, {
      where: { productId: product.id, isActive: true },
    });

    let variant: ProductVariant | null = null;
    if (dto.variantId) {
      variant = variants.find((v) => v.id === dto.variantId) ?? null;
      if (!variant) {
        throw new NotFoundException('Varyant bulunamadı');
      }
    } else if (variants.length) {
      variant =
        variants.find((v) => Number(v.stock) > 0) ?? variants[0] ?? null;
    }

    let unitPrice = product.basePrice;
    let variantId: string | null = null;
    let availableStock = Number(product.stock);
    if (variant) {
      unitPrice = variant.price;
      variantId = variant.id;
      availableStock = Number(variant.stock);
    }

    const campaignPrice = await this.campaigns.priceForProduct(
      product.id,
      unitPrice,
    );
    if (campaignPrice) {
      unitPrice = campaignPrice.salePrice;
    }

    const grindOption = resolveGrindOption(product.kind, dto.grindOption);
    const qtyToAdd = dto.quantity;

    const existing = cart.items?.find(
      (i) =>
        i.productId === product.id &&
        (i.variantId ?? null) === variantId &&
        grindMatchKey(product.kind, i.grindOption) ===
          grindMatchKey(product.kind, grindOption),
    );

    const nextQty = (existing?.quantity ?? 0) + qtyToAdd;
    if (availableStock < nextQty) {
      throw new BadRequestException(
        availableStock <= 0
          ? 'Bu ürün stokta yok'
          : `Yetersiz stok (kalan: ${availableStock})`,
      );
    }

    if (existing) {
      existing.quantity = nextQty;
      existing.unitPrice = unitPrice;
      existing.grindOption = grindOption;
      await this.em.save(existing);
    } else {
      const item = this.em.create(CartItem, {
        cartId: cart.id,
        productId: product.id,
        variantId,
        grindOption,
        quantity: qtyToAdd,
        unitPrice,
      });
      await this.em.save(item);
    }

    await this.touchCart(cart);
    return this.getCart(userId, sessionId);
  }

  async updateItem(
    itemId: string,
    dto: UpdateCartItemDto,
    userId?: string | null,
    sessionId?: string | null,
  ) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const item = await this.em.findOne(CartItem, {
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Sepet kalemi bulunamadı');
    }

    const stock = await this.availableStock(item.productId, item.variantId);
    if (dto.quantity > stock) {
      throw new BadRequestException(
        stock <= 0
          ? 'Bu ürün stokta yok'
          : `Yetersiz stok (kalan: ${stock})`,
      );
    }

    item.quantity = dto.quantity;
    if (dto.grindOption !== undefined) {
      const product = await this.em.findOne(Product, {
        where: { id: item.productId },
      });
      item.grindOption = resolveGrindOption(product?.kind, dto.grindOption);
    }
    await this.em.save(item);
    await this.touchCart(cart);
    return this.getCart(userId, sessionId);
  }

  async removeItem(
    itemId: string,
    userId?: string | null,
    sessionId?: string | null,
  ) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const item = await this.em.findOne(CartItem, {
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Sepet kalemi bulunamadı');
    }
    await this.em.remove(item);
    await this.touchCart(cart);
    return this.getCart(userId, sessionId);
  }

  private async availableStock(
    productId: string | null,
    variantId: string | null,
  ): Promise<number> {
    if (variantId) {
      const variant = await this.em.findOne(ProductVariant, {
        where: { id: variantId, isActive: true },
      });
      return Number(variant?.stock ?? 0);
    }
    if (!productId) return 0;
    const product = await this.em.findOne(Product, {
      where: { id: productId, isActive: true },
      relations: { variants: true },
    });
    if (!product) return 0;
    const active = (product.variants || []).filter((v) => v.isActive !== false);
    if (active.length) {
      return active.reduce((sum, v) => sum + Number(v.stock || 0), 0);
    }
    return Number(product.stock ?? 0);
  }

  /** Abandoned cart cron için güncel aktivite zamanı */
  private async touchCart(cart: Cart) {
    await this.em.update(Cart, cart.id, {
      abandonedReminderAt: null,
      abandonedReminder2At: null,
    });
  }

  async setGuestEmail(
    email: string,
    userId?: string | null,
    sessionId?: string | null,
  ) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const normalized = email.toLowerCase().trim();
    cart.guestEmail = normalized;
    await this.em.save(cart);
    return this.getCart(userId, sessionId);
  }

  private withTotals(cart: Cart) {
    const items = cart.items || [];
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    return {
      ...cart,
      items,
      subtotal: subtotal.toFixed(2),
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
    };
  }
}
