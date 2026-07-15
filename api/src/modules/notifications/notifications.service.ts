import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Order } from '@entities/order.entity';
import { Shipment } from '@entities/shipment.entity';
import {
  NotificationChannel,
  NotificationLog,
  NotificationStatus,
} from '@entities/notification-log.entity';
import {
  QUEUE_NOTIFICATIONS,
  NotificationJobPayload,
} from '@modules/queues/queue.constants';
import { EmailProvider } from '@modules/notifications/providers/email.provider';
import { SmsProviderRouter } from '@modules/notifications/providers/sms.provider';
import {
  buildEmailContent,
  buildSmsBody,
  resolveFrontendUrl,
  statusLabel,
} from '@modules/notifications/notification.templates';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(QUEUE_NOTIFICATIONS) private readonly notifyQueue: Queue,
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly email: EmailProvider,
    private readonly sms: SmsProviderRouter,
    private readonly config: ConfigService,
  ) {}

  async enqueueOrderStatus(
    orderId: string,
    template: string,
    channels: Array<'email' | 'sms'> = ['email', 'sms'],
    context: Record<string, unknown> = {},
  ) {
    const payload: NotificationJobPayload = {
      orderId,
      template,
      channels,
      context,
    };
    await this.notifyQueue.add(template, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  async enqueueShipmentStatus(
    orderId: string,
    shipmentId: string,
    template: string,
    channels: Array<'email' | 'sms'> = ['email', 'sms'],
    context: Record<string, unknown> = {},
  ) {
    const payload: NotificationJobPayload = {
      orderId,
      shipmentId,
      template,
      channels,
      context,
    };
    await this.notifyQueue.add(template, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  async processJob(payload: NotificationJobPayload): Promise<void> {
    const order = await this.em.findOne(Order, {
      where: { id: payload.orderId },
    });
    if (!order) {
      this.logger.warn(`Order not found for notification: ${payload.orderId}`);
      return;
    }

    let shipment: Shipment | null = null;
    if (payload.shipmentId) {
      shipment = await this.em.findOne(Shipment, {
        where: { id: payload.shipmentId },
      });
    }

    const frontendUrl = resolveFrontendUrl(this.config);
    const ctx = {
      order,
      shipment,
      statusLabel:
        typeof payload.context?.statusLabel === 'string'
          ? payload.context.statusLabel
          : statusLabel(
              (payload.context?.status as string) ||
                shipment?.status ||
                order.status,
            ),
      trackingUrl:
        typeof payload.context?.trackingUrl === 'string'
          ? payload.context.trackingUrl
          : undefined,
      frontendUrl,
    };

    for (const channel of payload.channels) {
      if (channel === 'email') {
        await this.sendEmail(order, shipment, payload.template, ctx);
      } else if (channel === 'sms') {
        await this.sendSms(order, shipment, payload.template, ctx);
      }
    }
  }

  private async sendEmail(
    order: Order,
    shipment: Shipment | null,
    template: string,
    ctx: Parameters<typeof buildEmailContent>[1],
  ) {
    const log = this.em.create(NotificationLog, {
      channel: NotificationChannel.EMAIL,
      recipient: order.customerEmail,
      template,
      orderId: order.id,
      shipmentId: shipment?.id ?? null,
      status: NotificationStatus.PENDING,
      payload: { template },
    });
    await this.em.save(log);

    try {
      const content = buildEmailContent(template, ctx);
      const result = await this.email.send({
        to: order.customerEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
      log.status = NotificationStatus.SENT;
      log.providerMessageId = result.id ?? null;
      await this.em.save(log);
    } catch (err) {
      log.status = NotificationStatus.FAILED;
      log.errorMessage = err instanceof Error ? err.message : String(err);
      await this.em.save(log);
      throw err;
    }
  }

  private async sendSms(
    order: Order,
    shipment: Shipment | null,
    template: string,
    ctx: Parameters<typeof buildSmsBody>[1],
  ) {
    if (!order.customerPhone) {
      this.logger.warn(`Order ${order.id} has no phone — skip SMS`);
      return;
    }

    const log = this.em.create(NotificationLog, {
      channel: NotificationChannel.SMS,
      recipient: order.customerPhone,
      template,
      orderId: order.id,
      shipmentId: shipment?.id ?? null,
      status: NotificationStatus.PENDING,
      payload: { template },
    });
    await this.em.save(log);

    try {
      const body = buildSmsBody(template, ctx);
      const result = await this.sms.send({
        to: order.customerPhone,
        body,
      });
      log.status = NotificationStatus.SENT;
      log.providerMessageId = result.id ?? null;
      await this.em.save(log);
    } catch (err) {
      log.status = NotificationStatus.FAILED;
      log.errorMessage = err instanceof Error ? err.message : String(err);
      await this.em.save(log);
      throw err;
    }
  }

  async listForOrder(orderId: string): Promise<NotificationLog[]> {
    return this.em.find(NotificationLog, {
      where: { orderId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
