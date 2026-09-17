import { MarketplacePlatform } from '@entities/marketplace-account.entity';

export interface SyncStockItem {
  externalListingId: string;
  stock: number;
  sku?: string;
}

export interface PulledOrder {
  externalOrderId: string;
  externalStatus: string;
  payload: Record<string, unknown>;
}

export interface PushProductInput {
  productId: string;
  name: string;
  price: string;
  stock: number;
  sku?: string;
  description?: string;
  imageUrl?: string;
  /** Hepsiburada leaf kategori ID (ürün kaydından) */
  hepsiburadaCategoryId?: string;
  /** Gramaj etiketi (250g vb.) — HB ürün adına / attribute’a yazılır */
  weightLabel?: string;
  grindOption?: string;
  roastOption?: string;
  /** Varyant barkodu */
  barcode?: string;
  /** HB kardeş varyant grubu (aynı ürünün tüm SKU’ları) */
  varyantGroupId?: string;
  /** Ürün kind — kahve dışı miktar tahmini kapatılır */
  productKind?: string;
  /** Ürün kaydındaki HB attribute override’ları */
  hepsiburadaAttributes?: Record<string, string | number | boolean> | null;
}

export interface PushProductResult {
  externalListingId: string;
  rawResponse: Record<string, unknown>;
  mock: boolean;
  stub?: boolean;
  /** true = kasıtlı atlandı (örn. HB kategori ID yok); hata değil */
  skipped?: boolean;
  message?: string;
}

export type MarketplaceFulfillInput = {
  externalOrderId: string;
  payload: Record<string, unknown>;
  /** HepsiJet, ARAS, … — credentials.cargoCompany yoksa varsayılan */
  cargoCompany?: string;
  trackingNumber?: string;
};

export type MarketplaceFulfillResult = {
  ok: boolean;
  mock: boolean;
  packageNumber?: string;
  trackingNumber?: string;
  labelUrl?: string;
  message?: string;
  raw: Record<string, unknown>;
};

export interface IMarketplaceAdapter {
  readonly platform: MarketplacePlatform;
  syncStock(
    credentials: Record<string, string>,
    items: SyncStockItem[],
  ): Promise<{
    synced: number;
    mock: boolean;
    stub?: boolean;
    message?: string;
    raw: Record<string, unknown>;
  }>;
  pullOrders(
    credentials: Record<string, string>,
  ): Promise<{
    orders: PulledOrder[];
    mock: boolean;
    stub?: boolean;
    message?: string;
  }>;
  pushProduct(
    credentials: Record<string, string>,
    input: PushProductInput,
  ): Promise<PushProductResult>;
  /** Opsiyonel: iç sipariş shipped olduğunda pazaryerine paket/kargo bildir */
  fulfillOrder?(
    credentials: Record<string, string>,
    input: MarketplaceFulfillInput,
  ): Promise<MarketplaceFulfillResult>;
}

export function hasMarketplaceCredentials(
  credentials: Record<string, string>,
): boolean {
  return Object.values(credentials || {}).some(
    (v) => typeof v === 'string' && v.trim().length > 0,
  );
}
