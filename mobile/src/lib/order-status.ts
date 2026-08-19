export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Ödeme bekleniyor',
  paid: 'Ödeme alındı',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoya verildi',
  delivered: 'Teslim edildi',
  cancelled: 'İptal edildi',
  refunded: 'İade edildi',
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  label_created: 'Etiket oluşturuldu',
  in_transit: 'Yolda',
  delivered: 'Teslim edildi',
  failed: 'Başarısız',
  returned: 'İade kargo',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status;
}

export function shipmentStatusLabel(status: string): string {
  return SHIPMENT_STATUS_LABELS[status] || ORDER_STATUS_LABELS[status] || status;
}

export function orderStatusHint(status: string): string | null {
  switch (status) {
    case 'pending_payment':
      return 'Ödeme tamamlanmadı. İşlemi bitirmeniz gerekiyor.';
    case 'paid':
      return 'Ödemeniz alındı. Sipariş kavurma sırasına alındı.';
    case 'processing':
      return 'Siparişiniz hazırlanıyor.';
    case 'shipped':
      return 'Paket kargoya verildi. Takip koduyla izleyebilirsiniz.';
    case 'delivered':
      return 'Teslim edildi.';
    case 'cancelled':
      return 'Bu sipariş iptal edildi.';
    case 'refunded':
      return 'Bu sipariş için iade işlemi yapıldı.';
    default:
      return null;
  }
}

export function roastLabel(value?: string | null) {
  if (!value) return null;
  const map: Record<string, string> = {
    light: 'Açık',
    medium: 'Orta',
    medium_light: 'Açık-orta',
    medium_dark: 'Orta-koyu',
    dark: 'Koyu',
  };
  return map[value.toLowerCase()] || value;
}

export function productOrigin(originCountry?: string | null, originRegion?: string | null) {
  return [originRegion, originCountry].filter(Boolean).join(', ') || null;
}
