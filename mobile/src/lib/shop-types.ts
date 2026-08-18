export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  weightLabel: string;
  price: string;
  stock: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string | null;
  originCountry: string | null;
  originRegion: string | null;
  roastLevel: string | null;
  flavorNotes: string[];
  imageUrl: string | null;
  gallery: string[];
  badge: string | null;
  basePrice: string;
  salePrice?: string | null;
  compareAtPrice?: string | null;
  campaignName?: string | null;
  currency: string;
  stock: number;
  isFeatured: boolean;
  ratingAvg?: string;
  ratingCount?: number;
  categoryId: string | null;
  variants?: ProductVariant[];
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  grindOption?: string | null;
  quantity: number;
  unitPrice: string;
  product?: Product;
  variant?: ProductVariant | null;
};

export type Cart = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  guestEmail?: string | null;
  items: CartItem[];
  subtotal?: string;
  currency?: string;
};

export type ShopUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
};

export type ShippingProvider = {
  id: string;
  code: string;
  name: string;
  fee: string;
};

export type Address = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  addressLine: string;
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

export type OrderItem = {
  id: string;
  productName: string;
  variantLabel: string | null;
  grindLabel?: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  customerEmail: string;
  customerName: string;
  subtotal: string;
  shippingFee: string;
  discountAmount?: string;
  taxAmount: string;
  total: string;
  currency: string;
  items: OrderItem[];
  createdAt?: string;
};

export type CouponPreview = {
  valid: boolean;
  code: string;
  title: string | null;
  type: 'percent' | 'fixed';
  value: string;
  discountAmount: string;
  message?: string;
};

export type PaymentInitResponse = {
  orderId: string;
  orderNumber: string;
  provider?: string;
  paymentPageUrl?: string;
  iframeUrl?: string | null;
  token?: string;
  mock?: boolean;
};

export type WishlistItem = {
  id: string;
  productId: string;
  product?: Product;
};

export type CheckoutPayload = {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood?: string;
    addressLine: string;
    postalCode: string;
  };
  billingAddress?: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood?: string;
    addressLine: string;
    postalCode: string;
  };
  shippingProvider: string;
  couponCode?: string;
  legalAcceptances: {
    mesafeliSatis: boolean;
    onBilgilendirme: boolean;
    kvkk: boolean;
  };
  notes?: string;
};
