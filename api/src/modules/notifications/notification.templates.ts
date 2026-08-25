import { ConfigService } from '@nestjs/config';
import { Order } from '@entities/order.entity';
import { Shipment } from '@entities/shipment.entity';

export type NotificationTemplateContext = {
  order: Order;
  shipment?: Shipment | null;
  statusLabel?: string;
  trackingUrl?: string;
  frontendUrl: string;
  adminUrl?: string;
  /** Admin sipariş maili: received | paid */
  opsEvent?: 'received' | 'paid';
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

const BRAND = 'Kılıç Coffee Roaster';
const BRAND_EMAIL = 'info@kiliccoffeeroaster.com.tr';

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function resolveFrontendUrl(config: ConfigService): string {
  return (
    config.get<string>('frontendUrl') || 'http://localhost:3000'
  ).replace(/\/$/, '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(amount: string | number, currency = 'TRY'): string {
  const n = Number(amount);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(amount);
  return currency === 'TRY' ? `${formatted} ₺` : `${formatted} ${currency}`;
}

function formatAddress(
  addr: Record<string, string> | null | undefined,
): string {
  if (!addr) return '—';
  const lines = [
    addr.fullName,
    addr.phone,
    addr.addressLine,
    [addr.neighborhood, addr.district, addr.city].filter(Boolean).join(', '),
    addr.postalCode,
  ].filter((x) => Boolean(x && String(x).trim()));
  return lines.length ? lines.join('\n') : '—';
}

function formatAddressOneLine(
  addr: Record<string, string> | null | undefined,
): string {
  return formatAddress(addr).replace(/\n/g, ' · ');
}

function orderItemsList(order: Order): string {
  const items = order.items || [];
  if (!items.length) return '—';
  return items
    .map((it) => {
      const parts = [it.productName];
      if (it.variantLabel) parts.push(it.variantLabel);
      if (it.grindLabel) parts.push(it.grindLabel);
      return `${parts.join(' · ')} ×${it.quantity} — ${formatMoney(it.lineTotal, order.currency)}`;
    })
    .join('\n');
}

/** Sipariş özeti HTML bloğu (ürünler + iletişim + adres + tutarlar) */
export function buildOrderDetailsHtml(
  order: Order,
  opts?: { includePersonal?: boolean },
): string {
  const includePersonal = opts?.includePersonal !== false;
  const items = order.items || [];
  const itemRows = items.length
    ? items
        .map((it) => {
          const name = [it.productName, it.variantLabel, it.grindLabel]
            .filter(Boolean)
            .join(' · ');
          return `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #3d3229;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8ddd0;">${escapeHtml(name)} <span style="color:#a89888;">×${it.quantity}</span></td>
            <td style="padding:8px 0;border-bottom:1px solid #3d3229;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#f5efe6;text-align:right;white-space:nowrap;">${escapeHtml(formatMoney(it.lineTotal, order.currency))}</td>
          </tr>`;
        })
        .join('')
    : `<tr><td colspan="2" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#a89888;">Kalem yok</td></tr>`;

  const ship = formatAddress(order.shippingAddress);
  const bill = order.billingAddress
    ? formatAddress(order.billingAddress)
    : null;

  const personalBlock = includePersonal
    ? `
    <p style="margin:20px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c4a574;">Müşteri</p>
    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8ddd0;white-space:pre-line;">${escapeHtml(
      [
        order.customerName,
        order.customerEmail,
        order.customerPhone,
      ]
        .filter(Boolean)
        .join('\n'),
    )}</p>
    <p style="margin:16px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c4a574;">Teslimat adresi</p>
    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8ddd0;white-space:pre-line;">${escapeHtml(ship)}</p>
    ${
      bill && bill !== ship
        ? `<p style="margin:16px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c4a574;">Fatura adresi</p>
    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8ddd0;white-space:pre-line;">${escapeHtml(bill)}</p>`
        : ''
    }
    ${
      order.notes
        ? `<p style="margin:16px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c4a574;">Not</p>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#e8ddd0;">${escapeHtml(order.notes)}</p>`
        : ''
    }`
    : '';

  return `
    <p style="margin:20px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c4a574;">Sipariş içeriği</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
    ${personalBlock}
  `;
}

export function buildOrderDetailsText(
  order: Order,
  opts?: { includePersonal?: boolean },
): string {
  const includePersonal = opts?.includePersonal !== false;
  const lines = [
    `Sipariş: ${order.orderNumber}`,
    `Durum: ${statusLabel(order.status)}`,
    '',
    'Ürünler:',
    orderItemsList(order),
    '',
    `Ara toplam: ${formatMoney(order.subtotal, order.currency)}`,
    Number(order.discountAmount) > 0
      ? `İndirim: −${formatMoney(order.discountAmount, order.currency)}${order.couponCode ? ` (${order.couponCode})` : ''}`
      : null,
    `Kargo: ${formatMoney(order.shippingFee, order.currency)}${order.shippingProvider ? ` · ${order.shippingProvider}` : ''}`,
    `Toplam: ${formatMoney(order.total, order.currency)}`,
  ];
  if (includePersonal) {
    lines.push(
      '',
      `Müşteri: ${order.customerName}`,
      `E-posta: ${order.customerEmail}`,
      `Telefon: ${order.customerPhone}`,
      `Teslimat: ${formatAddressOneLine(order.shippingAddress)}`,
    );
    if (order.billingAddress) {
      lines.push(
        `Fatura: ${formatAddressOneLine(order.billingAddress)}`,
      );
    }
    if (order.notes) lines.push(`Not: ${order.notes}`);
  }
  return lines.filter((x) => x !== null).join('\n');
}

function orderTotalMetaRows(
  order: Order,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: 'Sipariş', value: order.orderNumber },
    { label: 'Durum', value: statusLabel(order.status) },
    { label: 'Ara toplam', value: formatMoney(order.subtotal, order.currency) },
  ];
  if (Number(order.discountAmount) > 0) {
    rows.push({
      label: order.couponCode ? `İndirim (${order.couponCode})` : 'İndirim',
      value: `−${formatMoney(order.discountAmount, order.currency)}`,
    });
  }
  rows.push(
    {
      label: 'Kargo',
      value: `${formatMoney(order.shippingFee, order.currency)}${order.shippingProvider ? ` · ${order.shippingProvider}` : ''}`,
    },
    { label: 'Toplam', value: formatMoney(order.total, order.currency) },
  );
  return rows;
}

function trackUrlFor(ctx: NotificationTemplateContext): string {
  const trackCode = ctx.shipment?.trackingNumber;
  return (
    ctx.trackingUrl ||
    (trackCode
      ? `${ctx.frontendUrl}/takip/${encodeURIComponent(trackCode)}`
      : `${ctx.frontendUrl}/hesabim`)
  );
}

/** Ortak markalı HTML e-posta kabuğu */
export function renderBrandedEmail(input: {
  preheader?: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  metaRows?: { label: string; value: string }[];
  /** Önceden escape edilmiş / güvenli HTML (sipariş tablosu vb.) */
  extraHtml?: string;
}): string {
  const preheader = input.preheader || input.title;
  const rows = (input.metaRows || [])
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #3d3229;font-family:Georgia,serif;font-size:13px;color:#a89888;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(r.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #3d3229;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#f5efe6;text-align:right;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join('');

  const paras = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#e8ddd0;">${p}</p>`,
    )
    .join('');

  const cta = input.cta
    ? `<p style="margin:28px 0 8px;">
        <a href="${escapeHtml(input.cta.href)}" style="display:inline-block;background:#c4a574;color:#1a1410;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:14px 28px;">${escapeHtml(input.cta.label)}</a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#0f0c0a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0c0a;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1a1410;border:1px solid #3d3229;">
          <tr>
            <td style="padding:28px 28px 20px;border-bottom:1px solid #3d3229;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;letter-spacing:0.04em;color:#f5efe6;">${BRAND}</p>
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#c4a574;">Torbalı · İzmir</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c4a574;">${escapeHtml(input.title)}</p>
              <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:26px;line-height:1.25;font-weight:400;color:#f5efe6;">${escapeHtml(input.greeting)}</h1>
              ${paras}
              ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px;">${rows}</table>` : ''}
              ${input.extraHtml || ''}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #3d3229;background:#14100d;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a89888;">${BRAND}</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7a6b5c;">
                <a href="mailto:${BRAND_EMAIL}" style="color:#c4a574;text-decoration:none;">${BRAND_EMAIL}</a>
                · +90 541 214 79 63
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildEmailContent(
  template: string,
  ctx: NotificationTemplateContext,
): { subject: string; html: string; text: string } {
  const orderNo = ctx.order.orderNumber;
  const name = ctx.order.customerName;
  const trackCode = ctx.shipment?.trackingNumber;
  const trackUrl = trackUrlFor(ctx);
  const label = ctx.statusLabel || statusLabel(ctx.order.status);
  const ordersUrl = `${ctx.frontendUrl}/hesabim`;
  const detailsHtml = buildOrderDetailsHtml(ctx.order, {
    includePersonal: true,
  });
  const detailsText = buildOrderDetailsText(ctx.order, {
    includePersonal: true,
  });
  const totals = orderTotalMetaRows(ctx.order);

  switch (template) {
    case 'order_received':
      return {
        subject: `Siparişiniz alındı — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Sipariş alındı',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> numaralı siparişiniz alındı. Ödeme tamamlandığında hazırlığa başlıyoruz.`,
          ],
          metaRows: totals,
          extraHtml: detailsHtml,
          cta: { label: 'Siparişlerim', href: ordersUrl },
        }),
        text: `Merhaba ${name},\n\n${orderNo} siparişiniz alındı.\n\n${detailsText}\n\n${ordersUrl}`,
      };
    case 'order_ops_alert': {
      const isPaid = ctx.opsEvent === 'paid' || ctx.order.status === 'paid';
      const adminBase = (
        ctx.adminUrl ||
        process.env.ADMIN_URL ||
        'https://admin.kiliccoffeeroaster.com.tr'
      ).replace(/\/$/, '');
      return {
        subject: isPaid
          ? `Yeni ödeme — ${orderNo} · ${formatMoney(ctx.order.total, ctx.order.currency)}`
          : `Yeni sipariş — ${orderNo} · ${formatMoney(ctx.order.total, ctx.order.currency)}`,
        html: renderBrandedEmail({
          title: isPaid ? 'Yeni ödeme' : 'Yeni sipariş',
          greeting: isPaid ? 'Ödeme alındı' : 'Sipariş oluşturuldu',
          paragraphs: [
            isPaid
              ? `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> ödemesi tamamlandı. Hazırlığa başlayabilirsiniz.`
              : `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> oluşturuldu (ödeme bekleniyor).`,
            `${escapeHtml(ctx.order.customerName)} · ${escapeHtml(ctx.order.customerEmail)} · ${escapeHtml(ctx.order.customerPhone)}`,
          ],
          metaRows: totals,
          extraHtml: detailsHtml,
          cta: {
            label: 'Admin siparişler',
            href: `${adminBase}/siparisler`,
          },
        }),
        text: `${isPaid ? 'Yeni ödeme' : 'Yeni sipariş'}: ${orderNo}\n\n${detailsText}`,
      };
    }
    case 'order_paid':
      return {
        subject: `Ödemeniz alındı — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Ödeme alındı',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> numaralı siparişinizin ödemesi alındı. Kahveniz hazırlanmaya başlıyor.`,
          ],
          metaRows: totals,
          extraHtml: detailsHtml,
          cta: { label: 'Siparişlerim', href: ordersUrl },
        }),
        text: `Merhaba ${name},\n\n${orderNo} ödemesi alındı.\n\n${detailsText}\n\n${ordersUrl}`,
      };
    case 'order_status':
      return {
        subject: `Sipariş durumu: ${label} — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Sipariş güncellemesi',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> siparişinizin yeni durumu: <strong style="color:#c4a574;">${escapeHtml(label)}</strong>.`,
          ],
          metaRows: [
            { label: 'Sipariş', value: orderNo },
            { label: 'Durum', value: label },
            { label: 'Toplam', value: formatMoney(ctx.order.total, ctx.order.currency) },
          ],
          extraHtml: detailsHtml,
          cta: { label: 'Siparişlerim', href: ordersUrl },
        }),
        text: `Merhaba ${name},\n\n${orderNo} durumu: ${label}.\n\n${detailsText}\n\n${ordersUrl}`,
      };
    case 'return_requested':
      return {
        subject: `İade / iptal talebiniz alındı — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Talep alındı',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> için iptal/iade talebiniz alındı. İnceleme sonrası size bilgi vereceğiz.`,
          ],
          metaRows: [
            { label: 'Sipariş', value: orderNo },
            { label: 'Durum', value: 'Talep incelemede' },
          ],
          extraHtml: detailsHtml,
          cta: { label: 'Siparişlerim', href: ordersUrl },
        }),
        text: `Merhaba ${name}, ${orderNo} iptal/iade talebiniz alındı.\n\n${detailsText}\n\n${ordersUrl}`,
      };
    case 'return_approved':
      return {
        subject: `İade / iptal talebiniz onaylandı — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Talep onaylandı',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> için talebiniz onaylandı. Ödeme iadesi tamamlandığında bildirim alacaksınız.`,
          ],
          metaRows: [
            { label: 'Sipariş', value: orderNo },
            { label: 'Durum', value: label || 'Onaylandı' },
          ],
          extraHtml: detailsHtml,
          cta: { label: 'Siparişlerim', href: ordersUrl },
        }),
        text: `Merhaba ${name}, ${orderNo} iptal/iade talebiniz onaylandı.\n\n${detailsText}\n\n${ordersUrl}`,
      };
    case 'return_rejected':
      return {
        subject: `İade / iptal talebiniz — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Talep sonucu',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> için talebiniz şu an onaylanamadı. Detay için bizimle iletişime geçebilirsiniz.`,
          ],
          metaRows: [
            { label: 'Sipariş', value: orderNo },
            { label: 'Durum', value: 'Reddedildi' },
          ],
          extraHtml: detailsHtml,
          cta: { label: 'Siparişlerim', href: ordersUrl },
        }),
        text: `Merhaba ${name}, ${orderNo} iptal/iade talebiniz onaylanamadı.\n\n${ordersUrl}`,
      };
    case 'shipment_created':
      return {
        subject: `Kargoya verildi — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Kargoya verildi',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `<strong style="color:#f5efe6;">${escapeHtml(orderNo)}</strong> siparişiniz kargoya verildi.`,
          ],
          metaRows: [
            { label: 'Sipariş', value: orderNo },
            ...(trackCode
              ? [{ label: 'Takip kodu', value: trackCode }]
              : []),
            {
              label: 'Teslimat',
              value: formatAddressOneLine(ctx.order.shippingAddress),
            },
          ],
          extraHtml: buildOrderDetailsHtml(ctx.order, {
            includePersonal: false,
          }),
          cta: { label: 'Kargo takip', href: trackUrl },
        }),
        text: `Merhaba ${name}, ${orderNo} kargoya verildi. Takip: ${trackCode || trackUrl}\n\n${detailsText}`,
      };
    case 'shipment_status':
      return {
        subject: `Kargo güncellemesi: ${label} — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Kargo güncellemesi',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `Kargo durumunuz güncellendi: <strong style="color:#c4a574;">${escapeHtml(label)}</strong>.`,
          ],
          metaRows: [
            { label: 'Sipariş', value: orderNo },
            { label: 'Durum', value: label },
            ...(trackCode
              ? [{ label: 'Takip kodu', value: trackCode }]
              : []),
          ],
          cta: { label: 'Canlı takip', href: trackUrl },
        }),
        text: `Merhaba ${name}, kargo durumu ${label}. Takip: ${trackUrl}`,
      };
    default:
      return {
        subject: `${BRAND} bildirimi — ${orderNo}`,
        html: renderBrandedEmail({
          title: 'Sipariş bildirimi',
          greeting: `Merhaba ${name},`,
          paragraphs: [
            `Siparişiniz hakkında bir güncelleme var: <strong style="color:#c4a574;">${escapeHtml(label)}</strong>.`,
          ],
          metaRows: [
            { label: 'Sipariş', value: orderNo },
            { label: 'Durum', value: label },
          ],
          extraHtml: detailsHtml,
          cta: { label: 'Siparişlerim', href: ordersUrl },
        }),
        text: `Merhaba ${name}, sipariş güncellemesi: ${label}.\n\n${detailsText}`,
      };
  }
}

export function buildWhatsAppBody(
  template: string,
  ctx: NotificationTemplateContext,
): string {
  const orderNo = ctx.order.orderNumber;
  const name = ctx.order.customerName?.split(' ')[0] || 'Merhaba';
  const trackCode = ctx.shipment?.trackingNumber;
  const label = ctx.statusLabel || statusLabel(ctx.order.status);
  const trackUrl = trackUrlFor(ctx);

  switch (template) {
    case 'order_received':
      return `Merhaba ${name},\n\n${orderNo} numaralı siparişiniz alındı. Ödeme tamamlandığında hazırlığa başlıyoruz.\n\n${BRAND}`;
    case 'order_paid':
      return `Merhaba ${name},\n\n${orderNo} numaralı siparişinizin ödemesi alındı. Kahveniz hazırlanmaya başlıyor.\n\n${BRAND}`;
    case 'shipment_created':
      return `Merhaba ${name},\n\n${orderNo} siparişiniz kargoya verildi.${trackCode ? `\nTakip kodu: ${trackCode}` : ''}\nTakip: ${trackUrl}\n\n${BRAND}`;
    case 'shipment_status':
      return `Merhaba ${name},\n\nKargo durumu: ${label}.${trackCode ? `\nTakip kodu: ${trackCode}` : ''}\nTakip: ${trackUrl}\n\n${BRAND}`;
    case 'order_status':
      return `Merhaba ${name},\n\n${orderNo} siparişinizin yeni durumu: ${label}.\n\n${BRAND}`;
    default:
      return `Merhaba ${name},\n\n${orderNo} — ${label}\n\n${BRAND}`;
  }
}

/** @deprecated SMS kaldırıldı; geriye dönük importlar için alias */
export const buildSmsBody = buildWhatsAppBody;

export function buildPasswordResetEmail(input: {
  name: string;
  resetUrl: string;
  appResetUrl?: string;
  /** Google vb. OAuth hesabında henüz yerel şifre yoksa */
  isSetPassword?: boolean;
}): { subject: string; html: string; text: string } {
  const isSet = !!input.isSetPassword;
  const paragraphs = [
    isSet
      ? 'Hesabınıza e-posta ve şifre ile de giriş yapabilmeniz için bir şifre belirleyebilirsiniz. Google ile girişiniz açık kalır. Bağlantı 1 saat geçerlidir.'
      : 'Hesabınız için şifre sıfırlama talebi aldık. Bağlantı 1 saat geçerlidir. Siz talep etmediyseniz bu e-postayı yok sayabilirsiniz.',
  ];
  if (input.appResetUrl) {
    paragraphs.push(
      `Uygulamayı kullanıyorsanız bu bağlantıyı açın: ${input.appResetUrl}`,
    );
  }
  return {
    subject: isSet ? 'Şifre belirleme' : 'Şifre sıfırlama',
    html: renderBrandedEmail({
      title: isSet ? 'Şifre belirleme' : 'Şifre sıfırlama',
      greeting: `Merhaba ${input.name},`,
      paragraphs,
      cta: {
        label: isSet ? 'Şifre belirle' : 'Şifreyi sıfırla',
        href: input.resetUrl,
      },
    }),
    text: isSet
      ? `Merhaba ${input.name}, şifre belirlemek için: ${input.resetUrl}${input.appResetUrl ? ` · uygulama: ${input.appResetUrl}` : ''} (1 saat geçerli). Google ile girişiniz açık kalır.`
      : `Merhaba ${input.name}, şifrenizi sıfırlamak için: ${input.resetUrl}${input.appResetUrl ? ` · uygulama: ${input.appResetUrl}` : ''} (1 saat geçerli)`,
  };
}

export function buildOpsAccessDecisionEmail(input: {
  name: string;
  approved: boolean;
  accountUrl: string;
  rejectReason?: string;
}): { subject: string; html: string; text: string } {
  const name = input.name.trim() || 'Merhaba';
  if (input.approved) {
    const paragraphs = [
      'Personel erişim talebiniz onaylandı.',
      'Masaüstü veya mobil personel uygulamasına aynı e-posta ve şifrenizle giriş yapabilirsiniz. Web mağazadaki müşteri hesabınız da açık kalır.',
    ];
    return {
      subject: 'Personel erişiminiz onaylandı',
      html: renderBrandedEmail({
        title: 'Personel erişiminiz onaylandı',
        greeting: `Merhaba ${name},`,
        paragraphs,
        cta: { label: 'Hesabıma git', href: input.accountUrl },
      }),
      text: `Merhaba ${name}, personel erişim talebiniz onaylandı. Personel uygulamasına aynı e-posta ve şifrenizle giriş yapabilirsiniz. ${input.accountUrl}`,
    };
  }
  const reason =
    input.rejectReason ||
    'Personel erişim talebiniz, başvuru şartlarının karşılanmaması nedeniyle onaylanmamıştır. Hesabınız müşteri olarak kullanılmaya devam eder; web mağazamızdan alışveriş yapabilirsiniz.';
  return {
    subject: 'Personel erişim talebiniz reddedildi',
    html: renderBrandedEmail({
      title: 'Personel erişim talebiniz reddedildi',
      greeting: `Merhaba ${name},`,
      paragraphs: [
        reason,
        'Sorularınız için bizimle iletişime geçebilirsiniz.',
      ],
      cta: { label: 'Mağazaya git', href: input.accountUrl },
    }),
    text: `Merhaba ${name}, ${reason} ${input.accountUrl}`,
  };
}

export function buildAbandonedCartEmail(input: {
  name: string;
  itemCount: number;
  cartUrl: string;
  reminder?: 1 | 2;
}): { subject: string; html: string; text: string } {
  const isSecond = input.reminder === 2;
  return {
    subject: isSecond
      ? 'Sepetiniz hâlâ sizi bekliyor'
      : 'Sepetinizde kahve sizi bekliyor',
    html: renderBrandedEmail({
      title: isSecond ? 'Son hatırlatma' : 'Sepet hatırlatması',
      greeting: `Merhaba ${input.name},`,
      paragraphs: [
        isSecond
          ? `Sepetinizdeki <strong style="color:#f5efe6;">${input.itemCount}</strong> ürün hâlâ sizi bekliyor. Siparişinizi tamamlamak için son bir hatırlatma.`
          : `Sepetinizde <strong style="color:#f5efe6;">${input.itemCount}</strong> ürün kaldı. Siparişinizi tamamlayın — taze kavrumlar tükenmeden.`,
      ],
      cta: { label: 'Sepete dön', href: input.cartUrl },
    }),
    text: `Merhaba ${input.name}, sepetinizde ${input.itemCount} ürün var: ${input.cartUrl}`,
  };
}

export function buildLowStockEmail(input: {
  label: string;
  stock: number;
  sku: string | null;
  adminUrl: string;
}): { subject: string; html: string; text: string } {
  return {
    subject: `Düşük stok: ${input.label} (${input.stock})`,
    html: renderBrandedEmail({
      title: 'Admin stok uyarısı',
      greeting: 'Merhaba,',
      paragraphs: [
        `<strong style="color:#f5efe6;">${escapeHtml(input.label)}</strong> stok seviyesi eşik altına düştü.`,
      ],
      metaRows: [
        { label: 'Stok', value: String(input.stock) },
        ...(input.sku ? [{ label: 'SKU', value: input.sku }] : []),
      ],
      cta: { label: 'Ürünleri yönet', href: `${input.adminUrl}/urunler` },
    }),
    text: `Düşük stok: ${input.label} — kalan ${input.stock}${input.sku ? ` (SKU: ${input.sku})` : ''}. Yönet: ${input.adminUrl}/urunler`,
  };
}
