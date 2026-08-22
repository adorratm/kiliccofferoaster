import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In, IsNull } from 'typeorm';
import { User, OPS_ROLES, UserRole } from '@entities/user.entity';
import {
  InAppNotification,
  InboxCategory,
} from '@entities/in-app-notification.entity';
import { NotificationPreference } from '@entities/notification-preference.entity';
import {
  DevicePushToken,
  PushPlatform,
} from '@entities/device-push-token.entity';
import { Order } from '@entities/order.entity';
import { Shipment } from '@entities/shipment.entity';
import { NotifyGateway } from '@modules/notifications/notify.gateway';
import { ExpoPushService } from '@modules/notifications/expo-push.service';
import {
  InboxCopy,
  abandonedCartCopy,
  contactMessageCopy,
  customerOrderCopy,
  lowStockCopy,
  opsOrderCopy,
  reviewModeratedCopy,
  reviewPendingCopy,
} from '@modules/notifications/inbox.templates';
import { UpdateNotificationPrefsDto } from '@modules/notifications/dto/inbox.dto';
import { paginateResult } from '@common/utils/pagination';

const CATEGORY_PREF: Record<InboxCategory, keyof NotificationPreference> = {
  [InboxCategory.ORDERS]: 'ordersEnabled',
  [InboxCategory.SHIPPING]: 'shippingEnabled',
  [InboxCategory.RETURNS]: 'returnsEnabled',
  [InboxCategory.ACCOUNT]: 'accountEnabled',
  [InboxCategory.MARKETING]: 'marketingEnabled',
  [InboxCategory.OPS_ORDERS]: 'opsOrdersEnabled',
  [InboxCategory.OPS_RETURNS]: 'opsReturnsEnabled',
  [InboxCategory.OPS_MESSAGES]: 'opsMessagesEnabled',
  [InboxCategory.OPS_REVIEWS]: 'opsReviewsEnabled',
  [InboxCategory.OPS_STOCK]: 'opsStockEnabled',
};

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly gateway: NotifyGateway,
    private readonly expoPush: ExpoPushService,
  ) {}

  async getPreferences(userId: string): Promise<NotificationPreference> {
    return this.ensurePrefs(userId);
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPrefsDto,
  ): Promise<NotificationPreference> {
    const prefs = await this.ensurePrefs(userId);
    const keys = [
      'inAppEnabled',
      'pushEnabled',
      'ordersEnabled',
      'shippingEnabled',
      'returnsEnabled',
      'accountEnabled',
      'marketingEnabled',
      'opsOrdersEnabled',
      'opsReturnsEnabled',
      'opsMessagesEnabled',
      'opsReviewsEnabled',
      'opsStockEnabled',
    ] as const;
    for (const key of keys) {
      if (dto[key] !== undefined) prefs[key] = dto[key] as boolean;
    }
    return this.em.save(prefs);
  }

  async listInbox(userId: string, page = 1, limit = 30) {
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await this.em.findAndCount(InAppNotification, {
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return paginateResult(items, total, Math.max(page, 1), take);
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.em.count(InAppNotification, {
      where: { userId, readAt: IsNull() },
    });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<InAppNotification> {
    const row = await this.em.findOne(InAppNotification, {
      where: { id, userId },
    });
    if (!row) throw new NotFoundException('Bildirim bulunamadı');
    if (!row.readAt) {
      row.readAt = new Date();
      await this.em.save(row);
    }
    return row;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.em.update(
      InAppNotification,
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { updated: result.affected || 0 };
  }

  async registerDevice(
    userId: string,
    token: string,
    platform: PushPlatform,
  ): Promise<DevicePushToken> {
    const existing = await this.em.findOne(DevicePushToken, { where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      existing.isActive = true;
      return this.em.save(existing);
    }
    const row = this.em.create(DevicePushToken, {
      userId,
      token,
      platform,
      isActive: true,
    });
    return this.em.save(row);
  }

  async unregisterDevice(userId: string, token: string): Promise<void> {
    await this.em.update(
      DevicePushToken,
      { userId, token },
      { isActive: false },
    );
  }

  async fromOrderTemplate(
    template: string,
    order: Order,
    shipment: Shipment | null,
    statusLabel?: string,
  ): Promise<void> {
    const customer = customerOrderCopy({
      template,
      orderNumber: order.orderNumber,
      orderId: order.id,
      statusLabel,
      trackingNumber: shipment?.trackingNumber,
    });
    if (customer && order.userId) {
      await this.notifyUser(order.userId, customer);
    }
    const ops = opsOrderCopy({
      template,
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName: order.customerName,
    });
    if (ops) await this.notifyOps(ops);
  }

  async notifyAbandonedCart(userId: string | null, itemCount: number) {
    if (!userId) return;
    await this.notifyUser(userId, abandonedCartCopy(itemCount));
  }

  async notifyContactMessage(name: string) {
    await this.notifyOps(contactMessageCopy(name));
  }

  async notifyReviewPending(productName: string, author: string) {
    await this.notifyOps(reviewPendingCopy(productName, author));
  }

  async notifyReviewModerated(
    userId: string,
    approved: boolean,
    productName: string,
  ) {
    await this.notifyUser(userId, reviewModeratedCopy(approved, productName));
  }

  async notifyLowStock(label: string, stock: number) {
    await this.notifyOps(lowStockCopy(label, stock));
  }

  async notifyUser(userId: string, copy: InboxCopy): Promise<void> {
    const prefs = await this.ensurePrefs(userId);
    if (!prefs.inAppEnabled) return;
    if (!prefs[CATEGORY_PREF[copy.category]]) return;

    const row = this.em.create(InAppNotification, {
      userId,
      audience: copy.audience,
      category: copy.category,
      type: copy.type,
      title: copy.title,
      body: copy.body,
      href: copy.href,
      orderId: copy.orderId ?? null,
      readAt: null,
    });
    const saved = await this.em.save(row);
    this.gateway.emitToUser(userId, saved);
    if (prefs.pushEnabled) {
      void this.pushToUser(userId, saved);
    }
  }

  async notifyOps(copy: InboxCopy): Promise<void> {
    const ops = await this.em.find(User, {
      where: { role: In(OPS_ROLES), isActive: true },
    });
    for (const user of ops) {
      await this.notifyUser(user.id, copy);
    }
  }

  /** Yalnızca admin hesaplarına (personel onay talepleri vb.) */
  async notifyAdmins(copy: InboxCopy): Promise<void> {
    const admins = await this.em.find(User, {
      where: { role: UserRole.ADMIN, isActive: true },
    });
    for (const user of admins) {
      await this.notifyUser(user.id, copy);
    }
  }

  private async ensurePrefs(userId: string): Promise<NotificationPreference> {
    let prefs = await this.em.findOne(NotificationPreference, {
      where: { userId },
    });
    if (prefs) return prefs;
    prefs = this.em.create(NotificationPreference, { userId });
    return this.em.save(prefs);
  }

  private async pushToUser(userId: string, row: InAppNotification) {
    const tokens = await this.em.find(DevicePushToken, {
      where: { userId, isActive: true },
    });
    const expoTokens = tokens
      .map((t) => t.token)
      .filter((t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));
    if (!expoTokens.length) return;
    try {
      await this.expoPush.send(expoTokens, {
        title: row.title,
        body: row.body,
        data: { href: row.href, id: row.id, type: row.type },
      });
    } catch (err) {
      this.logger.warn(
        `Expo push failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
