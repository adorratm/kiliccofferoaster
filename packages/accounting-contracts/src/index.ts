export const PRODUCT_KINDS = [
  'coffee_turkish',
  'coffee_filter',
  'coffee_espresso',
  'lokum',
  'draje',
  'nuts',
  'herbal_tea',
  'spice',
  'beverage',
  'tea',
  'other',
] as const;

export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const COFFEE_KINDS: ProductKind[] = [
  'coffee_turkish',
  'coffee_filter',
  'coffee_espresso',
];

export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  coffee_turkish: 'Türk Kahvesi',
  coffee_filter: 'Filtre Kahve',
  coffee_espresso: 'Espresso',
  lokum: 'Lokum',
  draje: 'Draje',
  nuts: 'Kuruyemiş',
  herbal_tea: 'Bitki Çayı',
  spice: 'Baharat',
  beverage: 'Meşrubat',
  tea: 'Çay',
  other: 'Diğer',
};

export const PRODUCT_UNITS = ['g', 'kg', 'adet', 'paket', 'lt'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const DEFAULT_CATEGORIES: {
  slug: string;
  name: string;
  kind: ProductKind;
  sortOrder: number;
}[] = [
  { slug: 'turk-kahvesi', name: 'Türk Kahvesi', kind: 'coffee_turkish', sortOrder: 1 },
  { slug: 'filtre-kahve', name: 'Filtre Kahve', kind: 'coffee_filter', sortOrder: 2 },
  { slug: 'espresso', name: 'Espresso', kind: 'coffee_espresso', sortOrder: 3 },
  { slug: 'lokum', name: 'Lokum', kind: 'lokum', sortOrder: 4 },
  { slug: 'draje', name: 'Draje', kind: 'draje', sortOrder: 5 },
  { slug: 'kuruyemis', name: 'Kuruyemiş', kind: 'nuts', sortOrder: 6 },
  { slug: 'bitki-cayi', name: 'Bitki Çayı', kind: 'herbal_tea', sortOrder: 7 },
  { slug: 'baharat', name: 'Baharat', kind: 'spice', sortOrder: 8 },
  { slug: 'mesrubat', name: 'Meşrubat', kind: 'beverage', sortOrder: 9 },
  { slug: 'cay', name: 'Çay', kind: 'tea', sortOrder: 10 },
];

export const PARTY_TYPES = ['customer', 'supplier'] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export const INVOICE_DIRECTIONS = ['sales', 'purchase'] as const;
export type InvoiceDirection = (typeof INVOICE_DIRECTIONS)[number];

export const INVOICE_STATUSES = [
  'draft',
  'queued',
  'sent',
  'accepted',
  'rejected',
  'cancelled',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const EDOCUMENT_TYPES = ['earchive', 'einvoice', 'none'] as const;
export type EDocumentType = (typeof EDOCUMENT_TYPES)[number];

export const CASH_ACCOUNT_KINDS = ['cash', 'bank', 'paytr', 'pos'] as const;
export type CashAccountKind = (typeof CASH_ACCOUNT_KINDS)[number];

export const CASH_ENTRY_TYPES = ['in', 'out'] as const;
export type CashEntryType = (typeof CASH_ENTRY_TYPES)[number];

export const STOCK_MOVEMENT_TYPES = [
  'in',
  'out',
  'count',
  'sale',
  'return',
  'purchase',
  'waste',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const CASH_EXPENSE_CATEGORIES = [
  'kira',
  'enerji',
  'ambalaj',
  'hammadde',
  'diger',
] as const;
export type CashExpenseCategory = (typeof CASH_EXPENSE_CATEGORIES)[number];

export const CASH_EXPENSE_CATEGORY_LABELS: Record<CashExpenseCategory, string> = {
  kira: 'Kira',
  enerji: 'Enerji',
  ambalaj: 'Ambalaj',
  hammadde: 'Hammadde',
  diger: 'Diğer',
};

export const SYNC_ACTIONS = ['upsert', 'delete'] as const;
export type SyncAction = (typeof SYNC_ACTIONS)[number];

export const SYNC_COLLECTIONS = [
  'parties',
  'invoices',
  'invoice_lines',
  'cash_accounts',
  'cash_entries',
  'stock_movements',
  'okc_sales',
] as const;
export type SyncCollection = (typeof SYNC_COLLECTIONS)[number];

export type SyncMutation = {
  clientId: string;
  collection: SyncCollection;
  action: SyncAction;
  payload: Record<string, unknown>;
  updatedAt: string;
};

export type SyncPushRequest = {
  deviceId: string;
  mutations: SyncMutation[];
};

export type SyncPushResult = {
  accepted: string[];
  conflicts: { clientId: string; reason: string }[];
  rejected: { clientId: string; reason: string }[];
};

export type SyncPullRequest = {
  since?: string | null;
  collections?: SyncCollection[];
};

export type SyncPullResponse = {
  serverTime: string;
  records: Record<SyncCollection, Record<string, unknown>[]>;
};

export const OPS_ROLES = ['admin', 'staff', 'accountant'] as const;
export type OpsRole = (typeof OPS_ROLES)[number];
