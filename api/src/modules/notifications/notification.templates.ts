import { ConfigService } from '@nestjs/config';
import { Order } from '@entities/order.entity';
import { Shipment } from '@entities/shipment.entity';

export type NotificationTemplateContext = {
  order: Order;
  shipment?: Shipment | null;
  statusLabel?: string;
  trackingUrl?: string;
  frontendUrl: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Ödeme bekleniyor',
  paid: 'Ödeme alındı',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoya verildi',
  delivered: 'Teslim edildi',
  cancelled: 'İptal edildi',
  refunded: 'İade edildi',
  pending: 'Beklemede',
  label_created: 'Etiket oluşturuldu',
  in_transit: 'Yolda',
  failed: 'Başarısız',
  returned: 'İade kargo',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function buildEmailContent(
  template: string,
  ctx: NotificationTemplateContext,
): { subject: string; html: string; text: string } {
  const brand = 'Kılıç Coffee Roasters';
  const orderNo = ctx.order.orderNumber;
  const name = ctx.order.customerName;
  const trackCode = ctx.shipment?.trackingNumber;
  const trackUrl =
    ctx.trackingUrl ||
    (trackCode
      ? `${ctx.frontendUrl}/takip/${encodeURIComponent(trackCode)}`
      : `${ctx.frontendUrl}/hesabim`);
  const label = ctx.statusLabel || statusLabel(ctx.order.status);

  const commonFooter = `<p style="color:#888;font-size:12px;margin-top:24px">${brand} · Torbalı / İzmir</p>`;

  switch (template) {
    case 'order_paid':
      return {
        subject: `Ödemeniz alındı — ${orderNo}`,
        html: `<p>Merhaba ${name},</p><p><strong>${orderNo}</strong> numaralı siparişinizin ödemesi alındı. Kahveniz hazırlanmaya başlıyor.</p><p><a href="${ctx.frontendUrl}/hesabim">Siparişlerim</a></p>${commonFooter}`,
        text: `Merhaba ${name}, ${orderNo} ödemesi alındı. ${ctx.frontendUrl}/hesabim`,
      };
    case 'order_status':
      return {
        subject: `Sipariş durumu: ${label} — ${orderNo}`,
        html: `<p>Merhaba ${name},</p><p><strong>${orderNo}</strong> siparişinizin yeni durumu: <strong>${label}</strong>.</p><p><a href="${ctx.frontendUrl}/hesabim">Siparişlerim</a></p>${commonFooter}`,
        text: `Merhaba ${name}, ${orderNo} durumu: ${label}.`,
      };
    case 'shipment_created':
      return {
        subject: `Kargoya verildi — ${orderNo}`,
        html: `<p>Merhaba ${name},</p><p><strong>${orderNo}</strong> siparişiniz kargoya verildi.</p>${trackCode ? `<p>Takip kodu: <strong>${trackCode}</strong></p>` : ''}<p><a href="${trackUrl}">Kargo takip</a></p>${commonFooter}`,
        text: `Merhaba ${name}, ${orderNo} kargoya verildi. Takip: ${trackCode || trackUrl}`,
      };
    case 'shipment_status':
      return {
        subject: `Kargo güncellemesi: ${label} — ${orderNo}`,
        html: `<p>Merhaba ${name},</p><p>Kargo durumu: <strong>${label}</strong>.</p>${trackCode ? `<p>Takip kodu: <strong>${trackCode}</strong></p>` : ''}<p><a href="${trackUrl}">Canlı takip</a></p>${commonFooter}`,
        text: `Merhaba ${name}, kargo durumu ${label}. Takip: ${trackUrl}`,
      };
    default:
      return {
        subject: `${brand} bildirimi — ${orderNo}`,
        html: `<p>Merhaba ${name},</p><p>Siparişiniz hakkında bir güncelleme var: ${label}.</p>${commonFooter}`,
        text: `Merhaba ${name}, sipariş güncellemesi: ${label}.`,
      };
  }
}

export function buildSmsBody(
  template: string,
  ctx: NotificationTemplateContext,
): string {
  const orderNo = ctx.order.orderNumber;
  const trackCode = ctx.shipment?.trackingNumber;
  const label = ctx.statusLabel || statusLabel(ctx.order.status);
  const trackUrl =
    ctx.trackingUrl ||
    (trackCode
      ? `${ctx.frontendUrl}/takip/${encodeURIComponent(trackCode)}`
      : ctx.frontendUrl);

  switch (template) {
    case 'order_paid':
      return `Kilic Coffee: ${orderNo} odemeniz alindi.`;
    case 'shipment_created':
      return `Kilic Coffee: ${orderNo} kargoya verildi. Takip: ${trackCode || trackUrl}`;
    case 'shipment_status':
      return `Kilic Coffee: Kargo ${label}. ${trackCode || ''} ${trackUrl}`.trim();
    case 'order_status':
      return `Kilic Coffee: ${orderNo} durumu: ${label}.`;
    default:
      return `Kilic Coffee: ${orderNo} — ${label}`;
  }
}

export function resolveFrontendUrl(config: ConfigService): string {
  return (
    config.get<string>('frontendUrl') || 'http://localhost:3000'
  ).replace(/\/$/, '');
}
