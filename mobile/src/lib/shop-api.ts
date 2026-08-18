import { api, asArray, toQuery } from './api';
import type {
  Address,
  Cart,
  Category,
  CheckoutPayload,
  CouponPreview,
  Order,
  Paginated,
  PaymentInitResponse,
  Product,
  ShopUser,
  ShippingProvider,
  WishlistItem,
} from './shop-types';

function asPage<T>(data: T[] | Paginated<T>, limit = 12): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      limit: data.length || limit,
      totalPages: 1,
    };
  }
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    limit: data.limit ?? limit,
    totalPages: data.totalPages ?? 1,
  };
}

export async function shopProducts(params?: {
  q?: string;
  categorySlug?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}): Promise<Paginated<Product>> {
  const qs = toQuery({
    q: params?.q,
    categorySlug: params?.categorySlug,
    featured: params?.featured,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  });
  const data = await api<Product[] | Paginated<Product>>(`/products${qs}`, {
    auth: 'none',
  });
  return asPage(data, params?.limit ?? 20);
}

export async function shopCategories(): Promise<Category[]> {
  const data = await api<Category[] | { items: Category[] }>('/categories', {
    auth: 'none',
  });
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function shopProduct(slug: string): Promise<Product> {
  return api<Product>(`/products/${encodeURIComponent(slug)}`, { auth: 'none' });
}

export async function shopCart(): Promise<Cart> {
  return api<Cart>('/cart', { auth: 'shop', session: true });
}

export async function shopAddCartItem(payload: {
  productId: string;
  variantId?: string | null;
  grindOption?: string | null;
  quantity?: number;
}): Promise<Cart> {
  return api<Cart>('/cart/items', {
    method: 'POST',
    auth: 'shop',
    session: true,
    body: {
      productId: payload.productId,
      variantId: payload.variantId ?? null,
      grindOption: payload.grindOption ?? 'whole_bean',
      quantity: payload.quantity ?? 1,
    },
  });
}

export async function shopUpdateCartItem(
  itemId: string,
  quantity: number,
): Promise<Cart> {
  return api<Cart>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    auth: 'shop',
    session: true,
    body: { quantity },
  });
}

export async function shopRemoveCartItem(itemId: string): Promise<Cart> {
  return api<Cart>(`/cart/items/${itemId}`, {
    method: 'DELETE',
    auth: 'shop',
    session: true,
  });
}

export function cartItemCount(cart: Cart | null | undefined) {
  if (!cart?.items?.length) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(cart: Cart | null | undefined) {
  if (!cart?.items?.length) return 0;
  return cart.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  );
}

export async function shopLogin(email: string, password: string) {
  return api<{ accessToken: string; user: ShopUser }>('/auth/login', {
    method: 'POST',
    auth: 'none',
    body: { email, password },
  });
}

export async function shopRegister(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  return api<{ accessToken: string; user: ShopUser }>('/auth/register', {
    method: 'POST',
    auth: 'none',
    body: payload,
  });
}

export async function shopMe() {
  return api<ShopUser>('/auth/me', { auth: 'shop' });
}

export async function shopShippingProviders(): Promise<ShippingProvider[]> {
  try {
    return await api<ShippingProvider[]>('/shipping/providers/public', {
      auth: 'none',
    });
  } catch {
    return [
      { id: 'yurtici', code: 'yurtici', name: 'Yurtiçi Kargo', fee: '89.90' },
    ];
  }
}

export async function shopValidateCoupon(
  code: string,
  subtotal: number,
  email?: string,
): Promise<CouponPreview> {
  const qs = toQuery({
    code: code.trim().toUpperCase(),
    subtotal,
    email: email?.trim(),
  });
  return api<CouponPreview>(`/coupons/validate${qs}`, {
    auth: 'shop',
    session: true,
  });
}

export async function shopCheckout(payload: CheckoutPayload) {
  return api<PaymentInitResponse>('/checkout', {
    method: 'POST',
    auth: 'shop',
    session: true,
    body: payload,
  });
}

export async function shopOrders(): Promise<Order[]> {
  const data = await api<Order[] | { items: Order[] }>('/orders/me', {
    auth: 'shop',
  });
  return asArray<Order>(data);
}

export async function shopOrder(id: string): Promise<Order> {
  return api<Order>(`/orders/${encodeURIComponent(id)}`, { auth: 'shop' });
}

export async function shopAddresses(): Promise<Address[]> {
  return api<Address[]>('/addresses', { auth: 'shop' });
}

export async function shopCreateAddress(payload: {
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood?: string;
  addressLine: string;
  postalCode: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}) {
  return api<Address>('/addresses', {
    method: 'POST',
    auth: 'shop',
    body: payload,
  });
}

export async function shopDeleteAddress(id: string) {
  return api<void>(`/addresses/${id}`, { method: 'DELETE', auth: 'shop' });
}

export async function shopWishlist(): Promise<WishlistItem[]> {
  return api<WishlistItem[]>('/wishlist', { auth: 'shop' });
}

export async function shopToggleWishlist(productId: string) {
  return api<{ inWishlist: boolean; productId: string }>('/wishlist/toggle', {
    method: 'POST',
    auth: 'shop',
    body: { productId },
  });
}

export async function shopSearch(q: string) {
  return api<{
    q: string;
    groups: {
      type: string;
      label: string;
      items: { id: string; title: string; subtitle?: string; href: string }[];
    }[];
  }>(`/search${toQuery({ q, limit: 12 })}`, { auth: 'none' });
}
