export function isStorePickup(provider?: string | null): boolean {
  return provider === 'store_pickup';
}

export function shippingMethodLabel(provider?: string | null): string {
  if (isStorePickup(provider)) return 'Mağazadan teslim';
  return provider || '—';
}
