export const STORE_PICKUP_CODE = "store_pickup";

export function isStorePickup(provider?: string | null): boolean {
  return provider === STORE_PICKUP_CODE;
}

export function shippingMethodLabel(provider?: string | null): string {
  if (isStorePickup(provider)) return "Mağazadan teslim";
  return provider || "—";
}
