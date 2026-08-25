/** Siparişte kargo yerine mağaza teslimi */
export const STORE_PICKUP_CODE = 'store_pickup';

export function isStorePickup(provider?: string | null): boolean {
  return provider === STORE_PICKUP_CODE;
}
