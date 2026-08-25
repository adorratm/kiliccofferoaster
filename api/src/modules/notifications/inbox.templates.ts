import {
  InboxAudience,
  InboxCategory,
} from '@entities/in-app-notification.entity';

export type InboxCopy = {
  audience: InboxAudience;
  category: InboxCategory;
  type: string;
  title: string;
  body: string;
  href: string | null;
  orderId?: string | null;
};

export function customerOrderCopy(input: {
  template: string;
  orderNumber: string;
  orderId: string;
  statusLabel?: string;
  trackingNumber?: string | null;
}): InboxCopy | null {
  const { template, orderNumber, orderId, statusLabel, trackingNumber } = input;
  const href = `/hesabim/siparisler/${orderId}`;
  if (template === 'order_received') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.ORDERS,
      type: template,
      title: 'Siparişin alındı',
      body: `${orderNumber} oluşturuldu. Ödeme tamamlanınca hazırlığa başlıyoruz.`,
      href,
      orderId,
    };
  }
  if (template === 'order_paid') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.ORDERS,
      type: template,
      title: 'Siparişin alındı',
      body: `${orderNumber} numaralı siparişinin ödemesi onaylandı.`,
      href,
      orderId,
    };
  }
  if (template === 'order_status') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.ORDERS,
      type: template,
      title: 'Sipariş durumu güncellendi',
      body: `${orderNumber} artık: ${statusLabel || 'güncellendi'}.`,
      href,
      orderId,
    };
  }
  if (template === 'shipment_created') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.SHIPPING,
      type: template,
      title: 'Siparişin kargoya verildi',
      body: trackingNumber
        ? `${orderNumber} kargoda. Takip: ${trackingNumber}`
        : `${orderNumber} kargoya verildi.`,
      href,
      orderId,
    };
  }
  if (template === 'shipment_status') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.SHIPPING,
      type: template,
      title: 'Kargo güncellendi',
      body: `${orderNumber} kargo durumu: ${statusLabel || 'güncellendi'}.`,
      href,
      orderId,
    };
  }
  if (template === 'return_requested') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.RETURNS,
      type: template,
      title: 'İade talebin alındı',
      body: `${orderNumber} için iade/iptal talebin kaydedildi.`,
      href,
      orderId,
    };
  }
  if (template === 'return_approved') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.RETURNS,
      type: template,
      title: 'İade talebin onaylandı',
      body: `${orderNumber} iade/iptal talebi onaylandı.`,
      href,
      orderId,
    };
  }
  if (template === 'return_rejected') {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.RETURNS,
      type: template,
      title: 'İade talebin reddedildi',
      body: `${orderNumber} iade/iptal talebi reddedildi.`,
      href,
      orderId,
    };
  }
  return null;
}

export function opsOrderCopy(input: {
  template: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
}): InboxCopy | null {
  const { template, orderNumber, orderId, customerName } = input;
  if (template === 'order_received') {
    return {
      audience: InboxAudience.OPS,
      category: InboxCategory.OPS_ORDERS,
      type: 'ops_order_received',
      title: 'Yeni sipariş',
      body: `${customerName} · ${orderNumber} (ödeme bekleniyor).`,
      href: `/siparisler/${orderId}`,
      orderId,
    };
  }
  if (template === 'order_paid') {
    return {
      audience: InboxAudience.OPS,
      category: InboxCategory.OPS_ORDERS,
      type: 'ops_order_paid',
      title: 'Yeni ödeme',
      body: `${customerName} · ${orderNumber} ödendi.`,
      href: `/siparisler/${orderId}`,
      orderId,
    };
  }
  if (template === 'return_requested') {
    return {
      audience: InboxAudience.OPS,
      category: InboxCategory.OPS_RETURNS,
      type: 'ops_return_requested',
      title: 'Yeni iade talebi',
      body: `${customerName} · ${orderNumber} iade/iptal istedi.`,
      href: `/iadeler`,
      orderId,
    };
  }
  return null;
}

export function abandonedCartCopy(itemCount: number): InboxCopy {
  return {
    audience: InboxAudience.USER,
    category: InboxCategory.MARKETING,
    type: 'abandoned_cart',
    title: 'Sepetin seni bekliyor',
    body: `${itemCount} ürün sepetinde kaldı. Kahven soğumasın.`,
    href: '/sepet',
  };
}

export function contactMessageCopy(name: string): InboxCopy {
  return {
    audience: InboxAudience.OPS,
    category: InboxCategory.OPS_MESSAGES,
    type: 'contact_message',
    title: 'Yeni iletişim mesajı',
    body: `${name} bir mesaj gönderdi.`,
    href: '/mesajlar',
  };
}

export function reviewPendingCopy(productName: string, author: string): InboxCopy {
  return {
    audience: InboxAudience.OPS,
    category: InboxCategory.OPS_REVIEWS,
    type: 'review_pending',
    title: 'Yeni ürün yorumu',
    body: `${author} · ${productName} yorumu onay bekliyor.`,
    href: '/yorumlar',
  };
}

export function reviewModeratedCopy(approved: boolean, productName: string): InboxCopy {
  return {
    audience: InboxAudience.USER,
    category: InboxCategory.ACCOUNT,
    type: 'review_moderated',
    title: approved ? 'Yorumun yayınlandı' : 'Yorumun yayınlanmadı',
    body: approved
      ? `${productName} yorumun yayında.`
      : `${productName} yorumun yayınlanmadı.`,
    href: '/hesabim',
  };
}

export function lowStockCopy(label: string, stock: number): InboxCopy {
  return {
    audience: InboxAudience.OPS,
    category: InboxCategory.OPS_STOCK,
    type: 'low_stock',
    title: 'Düşük stok',
    body: `${label} stok: ${stock}`,
    href: '/urunler',
  };
}

export function opsAccessRequestedCopy(
  name: string,
  email: string,
): InboxCopy {
  return {
    audience: InboxAudience.OPS,
    category: InboxCategory.OPS_MESSAGES,
    type: 'ops_access_requested',
    title: 'Yeni personel talebi',
    body: `${name} (${email}) personel erişimi istedi.`,
    href: '/personel-onaylari',
  };
}

/** Onay / red — e-posta ile aynı metin gövdesi */
export const OPS_ACCESS_REJECT_REASON =
  'Personel erişim talebiniz, başvuru şartlarının karşılanmaması nedeniyle onaylanmamıştır. Hesabınız müşteri olarak kullanılmaya devam eder; web mağazamızdan alışveriş yapabilirsiniz.';

export function opsAccessDecisionCopy(approved: boolean): InboxCopy {
  if (approved) {
    return {
      audience: InboxAudience.USER,
      category: InboxCategory.ACCOUNT,
      type: 'ops_access_approved',
      title: 'Personel erişiminiz onaylandı',
      body: 'Personel paneline aynı e-posta ve şifrenizle giriş yapabilirsiniz.',
      href: '/hesabim',
    };
  }
  return {
    audience: InboxAudience.USER,
    category: InboxCategory.ACCOUNT,
    type: 'ops_access_rejected',
    title: 'Personel erişim talebiniz reddedildi',
    body: OPS_ACCESS_REJECT_REASON,
    href: '/hesabim',
  };
}
