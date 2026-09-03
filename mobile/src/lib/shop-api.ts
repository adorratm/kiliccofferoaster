import { api, asArray, toQuery } from './api';
import type {
  Address,
  BlogPost,
  Cart,
  Category,
  CheckoutPayload,
  CouponPreview,
  GuestOrderLookup,
  LegalDocument,
  Order,
  Paginated,
  PaymentInitResponse,
  Product,
  ProductReview,
  ReturnRequest,
  ReturnRequestType,
  ShopUser,
  ShippingProvider,
  TrackingResult,
  WishlistItem,
  InboxItem,
} from './shop-types';
import type { CmsSection, SiteSettings } from './cms';
import { mergeSettings } from './cms';

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
  coffeeOnly?: boolean;
  sort?: 'name' | 'price' | 'createdAt' | 'stock';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<Paginated<Product>> {
  const qs = toQuery({
    q: params?.q,
    categorySlug: params?.categorySlug,
    featured: params?.featured,
    coffeeOnly: params?.coffeeOnly,
    sort: params?.sort,
    order: params?.order,
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
      ...(payload.variantId ? { variantId: payload.variantId } : {}),
      grindOption:
        payload.grindOption !== undefined ? payload.grindOption : 'whole_bean',
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

export async function shopSetGuestEmail(email: string): Promise<Cart> {
  return api<Cart>('/cart/guest-email', {
    method: 'PATCH',
    auth: 'shop',
    session: true,
    body: { email },
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

export async function shopUpdateAddress(
  id: string,
  payload: Partial<{
    title: string;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    addressLine: string;
    postalCode: string;
    isDefaultShipping: boolean;
    isDefaultBilling: boolean;
  }>,
) {
  return api<Address>(`/addresses/${id}`, {
    method: 'PATCH',
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

export async function shopCmsSettings(): Promise<SiteSettings> {
  const data = await api<unknown>('/cms/settings', { auth: 'none' });
  return mergeSettings(data);
}

export async function shopCmsSections(page: string): Promise<CmsSection[]> {
  const data = await api<CmsSection[] | { items: CmsSection[] }>(
    `/cms/sections${toQuery({ page })}`,
    { auth: 'none' },
  );
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function shopBlog(params?: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tag?: string;
}) {
  const qs = toQuery({
    page: params?.page ?? 1,
    limit: params?.limit ?? 12,
    sort: 'publishedAt',
    categorySlug: params?.categorySlug,
    tag: params?.tag,
  });
  const data = await api<BlogPost[] | Paginated<BlogPost>>(`/blog${qs}`, {
    auth: 'none',
  });
  return asPage(data, params?.limit ?? 12);
}

export async function shopBlogPost(slug: string): Promise<BlogPost> {
  return api<BlogPost>(`/blog/${encodeURIComponent(slug)}`, { auth: 'none' });
}

export async function shopLegal(slug: string): Promise<LegalDocument> {
  return api<LegalDocument>(`/legal/documents/${encodeURIComponent(slug)}`, {
    auth: 'none',
  });
}

export async function shopContact(payload: {
  senderName: string;
  senderEmail: string;
  protocolType: string;
  message: string;
}) {
  return api<{ ok?: boolean }>('/contact', {
    method: 'POST',
    auth: 'none',
    body: payload,
  });
}

export async function shopTrack(code: string): Promise<TrackingResult> {
  return api<TrackingResult>(`/shipping/track/${encodeURIComponent(code)}`, {
    auth: 'none',
  });
}

export async function shopLookupOrder(orderNumber: string, email: string) {
  return api<GuestOrderLookup>('/orders/lookup', {
    method: 'POST',
    auth: 'none',
    body: {
      orderNumber: orderNumber.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
    },
  });
}

export async function shopForgotPassword(email: string) {
  return api<{ ok: true }>('/auth/forgot-password', {
    method: 'POST',
    auth: 'none',
    body: { email: email.trim().toLowerCase() },
  });
}

export async function shopResetPassword(token: string, password: string) {
  return api<{ ok: true }>('/auth/reset-password', {
    method: 'POST',
    auth: 'none',
    body: { token, password },
  });
}

export async function shopChangePassword(payload: {
  currentPassword?: string;
  password: string;
}) {
  return api<{ ok: true }>('/auth/change-password', {
    method: 'POST',
    auth: 'shop',
    body: payload,
  });
}

export async function shopProductReviews(slug: string, page = 1, limit = 20) {
  return api<{
    items: ProductReview[];
    ratingAvg: string;
    ratingCount: number;
  }>(
    `/reviews/product/${encodeURIComponent(slug)}?page=${page}&limit=${limit}`,
    { auth: 'none' },
  );
}

export async function shopCreateReview(payload: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
}) {
  return api<ProductReview>('/reviews', {
    method: 'POST',
    auth: 'shop',
    body: payload,
  });
}

export async function shopReturnRequests(orderId: string) {
  const data = await api<ReturnRequest[] | { items: ReturnRequest[] }>(
    `/orders/${encodeURIComponent(orderId)}/return-requests`,
    { auth: 'shop' },
  );
  return asArray<ReturnRequest>(data);
}

export async function shopCreateReturnRequest(
  orderId: string,
  payload: { type: ReturnRequestType; reason: string },
) {
  return api<ReturnRequest>(
    `/orders/${encodeURIComponent(orderId)}/return-requests`,
    {
      method: 'POST',
      auth: 'shop',
      body: payload,
    },
  );
}

export async function shopInbox(page = 1) {
  return api<{
    items: InboxItem[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/notifications/inbox?page=${page}&limit=30`, { auth: 'shop' });
}

export async function shopInboxMarkRead(id: string) {
  return api<{ ok?: boolean }>(`/notifications/inbox/${id}/read`, {
    method: 'PATCH',
    auth: 'shop',
  });
}

export async function shopInboxMarkAllRead() {
  return api<{ ok?: boolean }>('/notifications/inbox/read-all', {
    method: 'PATCH',
    auth: 'shop',
  });
}
