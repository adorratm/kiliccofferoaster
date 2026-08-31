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
import { Order, OrderStatus } from '@entities/order.entity';
import { OrderItem } from '@entities/order-item.entity';
import { Payment, PaymentStatus } from '@entities/payment.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import {
  InitializePaymentDto,
  RevenuecatConfirmDto,
} from '@modules/payments/dto/payments.dto';
import { PaymentFulfillmentService } from '@modules/payments/payment-fulfillment.service';

type ProductMapEntry = { minAmount: number; productId: string };

type RevenueCatSubscriber = {
  subscriber?: {
    non_subscriptions?: Record<
      string,
      Array<{
        id: string;
        purchase_date: string;
        store_transaction_id?: string;
      }>
    >;
  };
};

@Injectable()
export class RevenuecatService {
  private readonly logger = new Logger(RevenuecatService.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly config: ConfigService,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('revenuecat.secretApiKey'));
  }

  clientStatus() {
    return {
      /** Secret key yoksa mobil checkout mock ile tamamlanır (RC SDK gerekmez). */
      serverMock: !this.isConfigured(),
      hasProductMap: Boolean(
        this.config.get<string>('revenuecat.productMap')?.trim(),
      ),
    };
  }

  async abandonOrder(orderId: string) {
    const order = await this.em.findOne(Order, {
      where: { id: orderId },
      relations: { payment: true },
    });
    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return { ok: true, skipped: true };
    }
    if (order.payment?.provider !== 'revenuecat') {
      return { ok: true, skipped: true };
    }
    order.status = OrderStatus.CANCELLED;
    if (order.payment) {
      order.payment.status = PaymentStatus.FAILED;
      await this.em.save(order.payment);
    }
    await this.em.save(order);
    return { ok: true };
  }

  async initializeCheckout(dto: InitializePaymentDto) {
    const order = await this.em.findOne(Order, {
      where: { id: dto.orderId },
      relations: { items: true, payment: true },
    });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.payment?.status !== PaymentStatus.PENDING &&
      order.payment?.status !== PaymentStatus.FAILED
    ) {
      throw new BadRequestException('Sipariş ödeme için uygun değil');
    }
    if (!order.payment) {
      throw new BadRequestException('Siparişe bağlı ödeme kaydı yok');
    }

    const checkoutProductId = this.resolveCheckoutProductId(Number(order.total));
    let purchaseItems: { productId: string; quantity: number }[];
    const tierOnly = Boolean(this.config.get<string>('revenuecat.productMap')?.trim());
    if (tierOnly && checkoutProductId) {
      purchaseItems = [{ productId: checkoutProductId, quantity: 1 }];
    } else {
      try {
        purchaseItems = await this.buildPurchaseItems(order);
      } catch (err) {
        if (checkoutProductId) {
          purchaseItems = [{ productId: checkoutProductId, quantity: 1 }];
        } else {
          throw err;
        }
      }
    }

    order.payment.provider = 'revenuecat';
    order.payment.status = PaymentStatus.PENDING;
    order.payment.conversationId = order.id;
    order.payment.rawResponse = {
      revenueCatAppUserId: order.id,
      purchaseItems,
      checkoutProductId,
    };
    await this.em.save(order.payment);

    return {
      provider: 'revenuecat' as const,
      mock: !this.isConfigured(),
      revenueCatAppUserId: order.id,
      total: order.total,
      currency: order.currency,
      purchaseItems,
      checkoutProductId,
    };
  }

  async confirmPurchase(dto: RevenuecatConfirmDto) {
    const order = await this.em.findOne(Order, {
      where: { id: dto.orderId },
      relations: { payment: true },
    });
    if (!order?.payment) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    if (order.payment.provider !== 'revenuecat') {
      throw new BadRequestException('Sipariş RevenueCat ödemesi değil');
    }
    if (order.payment.status === PaymentStatus.SUCCESS) {
      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
      };
    }

    if (!this.isConfigured()) {
      return this.fulfillment.applyResult(
        order.payment,
        true,
        { mock: true, confirmedAt: new Date().toISOString() },
        { paymentId: dto.transactionId || `mock-rc-${order.id}` },
      );
    }

    const verified = await this.verifySubscriberPurchase(
      order.id,
      dto.productId,
      dto.transactionId,
    );
    if (!verified) {
      throw new BadRequestException('Mağaza satın alması doğrulanamadı');
    }

    return this.fulfillment.applyResult(
      order.payment,
      true,
      verified.raw,
      { paymentId: verified.transactionId },
    );
  }

  async handleWebhook(body: Record<string, unknown>, authHeader?: string) {
    const expected = this.config.get<string>('revenuecat.webhookAuthKey') || '';
    if (expected) {
      const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
      if (token !== expected) {
        throw new UnauthorizedException('Geçersiz RevenueCat webhook');
      }
    }

    const event = (body.event || body) as Record<string, unknown>;
    const type = String(event.type || '');
    const appUserId = String(event.app_user_id || '');
    if (!appUserId) {
      return { ok: true, skipped: 'no_app_user_id' };
    }

    const successTypes = new Set([
      'INITIAL_PURCHASE',
      'NON_RENEWING_PURCHASE',
      'RENEWAL',
    ]);
    if (!successTypes.has(type)) {
      return { ok: true, skipped: type || 'ignored' };
    }

    const order = await this.em.findOne(Order, {
      where: { id: appUserId },
      relations: { payment: true },
    });
    if (!order?.payment || order.payment.provider !== 'revenuecat') {
      return { ok: true, skipped: 'order_not_found' };
    }
    if (order.payment.status === PaymentStatus.SUCCESS) {
      return { ok: true, skipped: 'already_paid' };
    }

    await this.fulfillment.applyResult(
      order.payment,
      true,
      { webhook: body, eventType: type },
      {
        paymentId:
          String(event.transaction_id || event.store_transaction_id || '') ||
          undefined,
      },
    );

    return { ok: true };
  }

  private async buildPurchaseItems(order: Order) {
    const items: { productId: string; quantity: number }[] = [];
    for (const line of order.items || []) {
      const productId = await this.resolveLineStoreProductId(line);
      items.push({ productId, quantity: line.quantity });
    }

    const shippingFee = Number(order.shippingFee || 0);
    if (shippingFee > 0) {
      const shippingProductId = this.config.get<string>(
        'revenuecat.shippingProductId',
      );
      if (!shippingProductId) {
        throw new BadRequestException(
          'Kargo ücreti için REVENUECAT_SHIPPING_PRODUCT_ID yapılandırın',
        );
      }
      items.push({ productId: shippingProductId, quantity: 1 });
    }

    if (!items.length) {
      throw new BadRequestException('Satın alınacak mağaza ürünü yok');
    }
    return items;
  }

  private async resolveLineStoreProductId(line: OrderItem): Promise<string> {
    if (line.variantId) {
      const variant = await this.em.findOne(ProductVariant, {
        where: { id: line.variantId },
      });
      if (variant?.sku?.trim()) {
        return variant.sku.trim();
      }
    }
    throw new BadRequestException(
      `Sipariş kalemi için mağaza ürün kimliği (SKU) tanımlı değil: ${line.productName}`,
    );
  }

  private resolveCheckoutProductId(total: number): string | null {
    const map = this.parseProductMap();
    if (!map.length) return null;

    const sorted = [...map].sort((a, b) => a.minAmount - b.minAmount);

    // Test / dev: tek ürün → sipariş tutarından bağımsız (örn. Test Store $0.99)
    if (sorted.length === 1) {
      return sorted[0].productId;
    }

    // En küçük yeterli kademe (total ≤ tier minAmount)
    const match = sorted.find((entry) => entry.minAmount >= total);
    if (match) return match.productId;

    // Total en yüksek kademeyi aşıyorsa yine en yüksek kademeyi kullan (prod tier listesi genişletilmeli)
    const max = sorted[sorted.length - 1];
    if (total > max.minAmount) {
      this.logger.warn(
        `Sipariş tutarı (${total}) en yüksek IAP kademesini (${max.minAmount}) aşıyor; ${max.productId} kullanılıyor`,
      );
      return max.productId;
    }

    return sorted[0]?.productId ?? null;
  }

  private parseProductMap(): ProductMapEntry[] {
    const raw = this.config.get<string>('revenuecat.productMap') || '';
    return raw
      .split(',')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const [amountRaw, productId] = chunk.split(':');
        const minAmount = Number(amountRaw);
        if (!productId?.trim() || !Number.isFinite(minAmount)) {
          return null;
        }
        return { minAmount, productId: productId.trim() };
      })
      .filter((entry): entry is ProductMapEntry => entry !== null);
  }

  private async verifySubscriberPurchase(
    appUserId: string,
    productId?: string,
    transactionId?: string,
  ) {
    const secret = this.config.get<string>('revenuecat.secretApiKey')!;
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (!res.ok) {
      this.logger.warn(`RevenueCat subscriber lookup failed: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as RevenueCatSubscriber;
    const nonSubs = data.subscriber?.non_subscriptions || {};
    const entries = Object.entries(nonSubs).flatMap(([pid, txs]) =>
      txs.map((tx) => ({ productId: pid, ...tx })),
    );
    if (!entries.length) return null;

    const match = entries.find((entry) => {
      if (transactionId && entry.store_transaction_id === transactionId) {
        return true;
      }
      if (productId && entry.productId === productId) {
        return true;
      }
      return false;
    });

    if (!match) return null;

    return {
      transactionId: match.store_transaction_id || match.id,
      raw: data as unknown as Record<string, unknown>,
    };
  }
}
