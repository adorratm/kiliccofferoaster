"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  checkout,
  createAddress,
  getMe,
  getMyAddresses,
  getShippingProviders,
  updateAddress,
  validateCoupon,
} from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { getToken } from "@/lib/auth";
import {
  cartSubtotal,
  fetchCart,
  getCartSessionId,
} from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { calculateOrderTotals } from "@/lib/pricing";
import { trackBeginCheckout } from "@/lib/analytics";
import { getSiteSettings, type SiteSettings } from "@/lib/cms";
import {
  STORE_PICKUP_CODE,
} from "@/lib/shipping";
import type {
  Address,
  Cart,
  CouponPreview,
  ShippingProvider,
  User,
} from "@/lib/types";

type AddressFields = {
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  postalCode: string;
};

type AddressMode = "saved" | "new";
type DeliveryMethod = "cargo" | "pickup";

const emptyAddr = (): AddressFields => ({
  city: "",
  district: "",
  neighborhood: "",
  addressLine: "",
  postalCode: "",
});

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(
    null,
  );
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [shippingId, setShippingId] = useState<string>("");
  const [billingId, setBillingId] = useState<string>("");
  const [billingSame, setBillingSame] = useState(true);
  const [shippingMode, setShippingMode] = useState<AddressMode>("new");
  const [billingMode, setBillingMode] = useState<AddressMode>("new");
  const [saveShippingAddress, setSaveShippingAddress] = useState(true);
  const [saveBillingAddress, setSaveBillingAddress] = useState(false);
  const [defaultShippingOnSave, setDefaultShippingOnSave] = useState(true);
  const [defaultBillingOnSave, setDefaultBillingOnSave] = useState(false);
  const [newShippingTitle, setNewShippingTitle] = useState("Ev");
  const [newBillingTitle, setNewBillingTitle] = useState("Fatura");
  const [defaultBusy, setDefaultBusy] = useState(false);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("cargo");
  const [storeContact, setStoreContact] = useState<SiteSettings["contact"] | null>(
    null,
  );

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shipping: emptyAddr(),
    billing: emptyAddr(),
    shippingProvider: "",
    mesafeliSatis: false,
    onBilgilendirme: false,
    kvkk: false,
    notes: "",
  });

  useEffect(() => {
    const token = getToken();
    Promise.all([
      fetchCart().catch(() => null),
      getShippingProviders(),
      token ? getMyAddresses(token) : Promise.resolve([] as Address[]),
      token ? getMe(token).catch(() => null) : Promise.resolve(null),
      getSiteSettings().catch(() => null),
    ]).then(([cartData, providerData, addressData, me, settings]) => {
      setCart(cartData);
      setProviders(providerData);
      setAddresses(addressData);
      setUser(me);
      if (settings?.contact) setStoreContact(settings.contact);

      if (cartData?.items?.length) {
        const subtotal = cartSubtotal(cartData);
        trackBeginCheckout({
          value: subtotal,
          currency: "TRY",
          itemCount: cartData.items.reduce((n, i) => n + i.quantity, 0),
        });
      }

      const defShip =
        addressData.find((a) => a.isDefaultShipping) || addressData[0];
      const defBill =
        addressData.find((a) => a.isDefaultBilling) || defShip;

      setForm((f) => {
        const next = { ...f };
        if (providerData[0] && !f.shippingProvider) {
          next.shippingProvider = providerData[0].code;
        }
        if (me) {
          next.customerEmail = me.email || f.customerEmail;
          next.customerName =
            [me.firstName, me.lastName].filter(Boolean).join(" ") ||
            f.customerName;
          next.customerPhone = me.phone || f.customerPhone;
        }
        if (defShip) {
          next.customerName = defShip.fullName || next.customerName;
          next.customerPhone = defShip.phone || next.customerPhone;
          next.shipping = {
            city: defShip.city,
            district: defShip.district,
            neighborhood: defShip.neighborhood || "",
            addressLine: defShip.addressLine,
            postalCode: defShip.postalCode,
          };
        }
        if (defBill && defBill.id !== defShip?.id) {
          next.billing = {
            city: defBill.city,
            district: defBill.district,
            neighborhood: defBill.neighborhood || "",
            addressLine: defBill.addressLine,
            postalCode: defBill.postalCode,
          };
        }
        return next;
      });

      if (defShip) {
        setShippingId(defShip.id);
        setShippingMode("saved");
      } else {
        setShippingMode("new");
      }
      if (defBill && defBill.id !== defShip?.id) {
        setBillingSame(false);
        setBillingId(defBill.id);
        setBillingMode("saved");
      } else if (defBill) {
        setBillingId(defBill.id);
        setBillingMode("saved");
      }

      setLoading(false);
    });
  }, []);

  function applyAddressToShipping(addr: Address) {
    setForm((f) => ({
      ...f,
      customerName: addr.fullName || f.customerName,
      customerPhone: addr.phone || f.customerPhone,
      shipping: {
        city: addr.city,
        district: addr.district,
        neighborhood: addr.neighborhood || "",
        addressLine: addr.addressLine,
        postalCode: addr.postalCode,
      },
    }));
  }

  function applyAddressToBilling(addr: Address) {
    setForm((f) => ({
      ...f,
      billing: {
        city: addr.city,
        district: addr.district,
        neighborhood: addr.neighborhood || "",
        addressLine: addr.addressLine,
        postalCode: addr.postalCode,
      },
    }));
  }

  function selectSavedShipping(addr: Address) {
    setShippingMode("saved");
    setShippingId(addr.id);
    applyAddressToShipping(addr);
  }

  function startNewShipping() {
    setShippingMode("new");
    setShippingId("");
    setForm((f) => ({ ...f, shipping: emptyAddr() }));
  }

  function selectSavedBilling(addr: Address) {
    setBillingMode("saved");
    setBillingId(addr.id);
    applyAddressToBilling(addr);
  }

  function startNewBilling() {
    setBillingMode("new");
    setBillingId("");
    setForm((f) => ({ ...f, billing: emptyAddr() }));
  }

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setShippingField<K extends keyof AddressFields>(
    key: K,
    value: AddressFields[K],
  ) {
    setForm((prev) => ({
      ...prev,
      shipping: { ...prev.shipping, [key]: value },
    }));
  }

  function setBillingField<K extends keyof AddressFields>(
    key: K,
    value: AddressFields[K],
  ) {
    setForm((prev) => ({
      ...prev,
      billing: { ...prev.billing, [key]: value },
    }));
  }

  async function refreshAddresses() {
    const token = getToken();
    if (!token) return;
    const next = await getMyAddresses(token);
    setAddresses(next);
  }

  async function makeDefault(
    id: string,
    kind: "shipping" | "billing",
  ) {
    const token = getToken();
    if (!token) return;
    setDefaultBusy(true);
    setError(null);
    try {
      await updateAddress(
        token,
        id,
        kind === "shipping"
          ? { isDefaultShipping: true }
          : { isDefaultBilling: true },
      );
      await refreshAddresses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Varsayılan adres ayarlanamadı",
      );
    } finally {
      setDefaultBusy(false);
    }
  }

  async function persistNewAddressesIfNeeded() {
    const token = getToken();
    if (!token || !user) return;

    if (
      deliveryMethod === "cargo" &&
      shippingMode === "new" &&
      saveShippingAddress
    ) {
      const created = await createAddress(token, {
        title: newShippingTitle.trim() || "Teslimat",
        fullName: form.customerName,
        phone: form.customerPhone,
        city: form.shipping.city,
        district: form.shipping.district,
        neighborhood: form.shipping.neighborhood || undefined,
        addressLine: form.shipping.addressLine,
        postalCode: form.shipping.postalCode,
        isDefaultShipping: defaultShippingOnSave,
        isDefaultBilling:
          billingSame && defaultShippingOnSave
            ? true
            : defaultBillingOnSave && billingSame,
      });
      setShippingId(created.id);
      setShippingMode("saved");
    }

    if (
      !billingSame &&
      billingMode === "new" &&
      saveBillingAddress
    ) {
      await createAddress(token, {
        title: newBillingTitle.trim() || "Fatura",
        fullName: form.customerName,
        phone: form.customerPhone,
        city: form.billing.city,
        district: form.billing.district,
        neighborhood: form.billing.neighborhood || undefined,
        addressLine: form.billing.addressLine,
        postalCode: form.billing.postalCode,
        isDefaultBilling: defaultBillingOnSave,
      });
    }

    await refreshAddresses();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.mesafeliSatis || !form.onBilgilendirme || !form.kvkk) {
      setError("Yasal onay kutularını işaretlemeniz gerekir.");
      return;
    }

    if (
      deliveryMethod === "cargo" &&
      shippingMode === "saved" &&
      !shippingId &&
      addresses.length > 0
    ) {
      setError("Teslimat için kayıtlı bir adres seçin veya yeni adres girin.");
      return;
    }

    if (deliveryMethod === "cargo" && !form.shippingProvider) {
      setError("Kargo sağlayıcısı seçin.");
      return;
    }

    setSubmitting(true);
    try {
      await persistNewAddressesIfNeeded();

      const sessionId = getCartSessionId();
      const pickup = deliveryMethod === "pickup";
      const shippingAddress = pickup
        ? undefined
        : {
            fullName: form.customerName,
            phone: form.customerPhone,
            city: form.shipping.city,
            district: form.shipping.district,
            neighborhood: form.shipping.neighborhood,
            addressLine: form.shipping.addressLine,
            postalCode: form.shipping.postalCode,
          };
      const billingSource =
        billingSame && !pickup
          ? form.shipping
          : billingSame && pickup
            ? null
            : form.billing;
      const billingAddress = billingSource
        ? {
            fullName: form.customerName,
            phone: form.customerPhone,
            city: billingSource.city,
            district: billingSource.district,
            neighborhood: billingSource.neighborhood,
            addressLine: billingSource.addressLine,
            postalCode: billingSource.postalCode,
          }
        : pickup
          ? undefined
          : {
              fullName: form.customerName,
              phone: form.customerPhone,
              city: form.shipping.city,
              district: form.shipping.district,
              neighborhood: form.shipping.neighborhood,
              addressLine: form.shipping.addressLine,
              postalCode: form.shipping.postalCode,
            };

      const result = await checkout(
        sessionId,
        {
          customerEmail: form.customerEmail,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          ...(shippingAddress ? { shippingAddress } : {}),
          ...(billingAddress ? { billingAddress } : {}),
          shippingProvider: pickup
            ? STORE_PICKUP_CODE
            : form.shippingProvider,
          couponCode: couponPreview?.valid ? couponPreview.code : undefined,
          legalAcceptances: {
            mesafeliSatis: form.mesafeliSatis,
            onBilgilendirme: form.onBilgilendirme,
            kvkk: form.kvkk,
          },
          notes: form.notes || undefined,
        },
        getToken(),
      );

      if (result.orderId) {
        try {
          sessionStorage.setItem("kilic_last_order_id", result.orderId);
          sessionStorage.setItem(
            "kilic_last_order_email",
            form.customerEmail.trim(),
          );
          if (result.orderNumber) {
            sessionStorage.setItem(
              "kilic_last_order_number",
              result.orderNumber,
            );
          }
        } catch {
          /* ignore */
        }
      }

      const { redirectToPayment } = await import("@/lib/payment-redirect");
      if (!redirectToPayment(result)) {
        setError("Ödeme yönlendirmesi alınamadı.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ödeme başlatılamadı. API bağlantısını kontrol edin.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = cartSubtotal(cart);
  const isPickup = deliveryMethod === "pickup";
  const selected = providers.find((p) => p.code === form.shippingProvider);
  const shippingFee = isPickup ? 0 : Number(selected?.fee || 0);
  const discountAmount = couponPreview?.valid
    ? Number(couponPreview.discountAmount)
    : 0;
  const totals = calculateOrderTotals(subtotal, shippingFee, {
    discountAmount,
  });
  const total = totals.total;

  async function applyCoupon() {
    setCouponError(null);
    setCouponPreview(null);
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Kupon kodu girin");
      return;
    }
    setCouponLoading(true);
    try {
      const preview = await validateCoupon(
        code,
        subtotal,
        form.customerEmail || undefined,
        getToken(),
      );
      if (!preview.valid) {
        setCouponError(preview.message || "Geçersiz kupon");
        return;
      }
      setCouponPreview(preview);
      setCouponInput(preview.code);
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : "Kupon doğrulanamadı",
      );
    } finally {
      setCouponLoading(false);
    }
  }

  function clearCoupon() {
    setCouponPreview(null);
    setCouponError(null);
    setCouponInput("");
  }

  if (loading) {
    return (
      <div className="page-shell py-24 font-meta text-sm uppercase text-secondary">
        Ödeme hazırlanıyor…
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="page-shell py-24">
        <h1 className="font-display text-4xl">Ödeme</h1>
        <p className="mt-4 font-meta text-sm uppercase text-secondary">
          Sepet boş.
        </p>
        <Link href="/urunler" className="btn-cta mt-8 inline-block px-8 py-4 text-xs">
          Alışverişe Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell py-16 md:py-24">
      <div className="page-enter mb-0">
        <div className="mb-2 font-meta text-xs uppercase tracking-widest text-primary">
          Checkout / PayTR
        </div>
        <h1 className="font-display text-4xl md:text-6xl">Ödeme</h1>
        {user ? (
          <p className="mt-3 font-meta text-[11px] uppercase text-secondary">
            Kayıtlı adreslerinizi seçebilir veya yeni ekleyebilirsiniz.{" "}
            <Link href="/hesabim" className="text-primary underline">
              Hesabım
            </Link>
          </p>
        ) : (
          <p className="mt-3 font-meta text-[11px] uppercase text-secondary">
            Adres defteri için{" "}
            <Link href="/giris?next=/odeme" className="text-primary underline">
              giriş yapın
            </Link>
            .
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12"
      >
        <div className="space-y-8 lg:col-span-8">
          <Reveal variant="left">
          <section className="panel-motion industrial-border bg-surface-container-low p-6 md:p-8">
            <h2 className="mb-6 font-display text-2xl">İletişim</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Ad Soyad"
                value={form.customerName}
                onChange={(v) => setField("customerName", v)}
                required
              />
              <Field
                label="Telefon"
                value={form.customerPhone}
                onChange={(v) => setField("customerPhone", v)}
                required
              />
              <Field
                label="E-posta"
                type="email"
                value={form.customerEmail}
                onChange={(v) => setField("customerEmail", v)}
                required
              />
            </div>
          </section>
          </Reveal>

          <Reveal variant="left" delay={40}>
          <section className="panel-motion industrial-border bg-surface-container-low p-6 md:p-8">
            <h2 className="mb-6 font-display text-2xl">Teslimat yöntemi</h2>
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center justify-between border px-4 py-4 font-meta text-xs uppercase ${
                  deliveryMethod === "cargo"
                    ? "border-primary text-primary"
                    : "border-outline-variant/30 text-secondary"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === "cargo"}
                    onChange={() => setDeliveryMethod("cargo")}
                  />
                  Kargo ile gönder
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start justify-between gap-4 border px-4 py-4 font-meta text-xs uppercase ${
                  deliveryMethod === "pickup"
                    ? "border-primary text-primary"
                    : "border-outline-variant/30 text-secondary"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    className="mt-0.5"
                    checked={deliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                  />
                  <span>
                    Mağazadan teslim al
                    <span className="mt-1 block normal-case tracking-normal text-secondary">
                      Ücretsiz · Hazır olduğunda mağazadan alın
                    </span>
                  </span>
                </span>
                <span className="shrink-0">{formatMoney(0)}</span>
              </label>
            </div>
            {isPickup && storeContact ? (
              <div className="mt-6 border border-outline-variant/30 bg-surface px-4 py-4 font-meta text-xs leading-relaxed text-secondary">
                <p className="uppercase tracking-widest text-primary">
                  Mağaza adresi
                </p>
                <p className="mt-2 normal-case tracking-normal text-on-surface">
                  {storeContact.address}
                </p>
                {storeContact.hours ? (
                  <p className="mt-2 normal-case tracking-normal">
                    Çalışma: {storeContact.hours}
                  </p>
                ) : null}
                {storeContact.phone ? (
                  <p className="mt-1 normal-case tracking-normal">
                    Tel: {storeContact.phone}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
          </Reveal>

          {!isPickup ? (
          <Reveal variant="left" delay={70}>
          <section className="panel-motion industrial-border bg-surface-container-low p-6 md:p-8">
            <h2 className="mb-6 font-display text-2xl">Teslimat adresi</h2>
            {addresses.length > 0 ? (
              <div className="mb-6 space-y-2">
                {addresses.map((addr) => {
                  const selected =
                    shippingMode === "saved" && shippingId === addr.id;
                  const live =
                    addresses.find((a) => a.id === addr.id) || addr;
                  return (
                    <div
                      key={addr.id}
                      className={`border px-4 py-3 transition-colors ${
                        selected
                          ? "border-primary"
                          : "border-outline-variant/30 hover:border-outline"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectSavedShipping(addr)}
                        className={`w-full text-left font-meta text-[11px] uppercase ${
                          selected ? "text-primary" : "text-secondary"
                        }`}
                      >
                        <span className="font-medium">{addr.title}</span>
                        {live.isDefaultShipping ? " · varsayılan" : ""}
                        <span className="mt-1 block normal-case tracking-normal text-secondary">
                          {addr.fullName} · {addr.addressLine}
                          <br />
                          {addr.district}, {addr.city}
                          {addr.postalCode ? ` · ${addr.postalCode}` : ""}
                        </span>
                      </button>
                      {selected && !live.isDefaultShipping ? (
                        <button
                          type="button"
                          disabled={defaultBusy}
                          onClick={() => void makeDefault(addr.id, "shipping")}
                          className="mt-3 font-meta text-[10px] uppercase text-secondary underline hover:text-primary disabled:opacity-50"
                        >
                          Varsayılan teslimat yap
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={startNewShipping}
                  className={`w-full border px-4 py-3 text-left font-meta text-[11px] uppercase transition-colors ${
                    shippingMode === "new"
                      ? "border-primary text-primary"
                      : "border-outline-variant/30 text-secondary hover:border-outline"
                  }`}
                >
                  + Yeni adres ekle
                </button>
              </div>
            ) : null}

            {shippingMode === "saved" && shippingId ? (
              <SelectedAddressSummary
                address={addresses.find((a) => a.id === shippingId)}
                fields={form.shipping}
                name={form.customerName}
                phone={form.customerPhone}
              />
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Şehir"
                    value={form.shipping.city}
                    onChange={(v) => setShippingField("city", v)}
                    required
                  />
                  <Field
                    label="İlçe"
                    value={form.shipping.district}
                    onChange={(v) => setShippingField("district", v)}
                    required
                  />
                  <Field
                    label="Mahalle"
                    value={form.shipping.neighborhood}
                    onChange={(v) => setShippingField("neighborhood", v)}
                  />
                  <Field
                    label="Posta Kodu"
                    value={form.shipping.postalCode}
                    onChange={(v) => setShippingField("postalCode", v)}
                    required
                  />
                  <div className="md:col-span-2">
                    <Field
                      label="Adres"
                      value={form.shipping.addressLine}
                      onChange={(v) => setShippingField("addressLine", v)}
                      required
                    />
                  </div>
                </div>
                {user ? (
                  <div className="mt-6 space-y-3 border-t border-outline-variant/20 pt-5">
                    <Check
                      checked={saveShippingAddress}
                      onChange={setSaveShippingAddress}
                      label={<span>Bu adresi adres defterime kaydet</span>}
                    />
                    {saveShippingAddress ? (
                      <>
                        <Field
                          label="Adres başlığı"
                          value={newShippingTitle}
                          onChange={setNewShippingTitle}
                          required
                        />
                        <Check
                          checked={defaultShippingOnSave}
                          onChange={setDefaultShippingOnSave}
                          label={
                            <span>Varsayılan teslimat adresi olarak tanımla</span>
                          }
                        />
                      </>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </section>
          </Reveal>
          ) : null}

          <Reveal variant="left" delay={120}>
          <section className="panel-motion industrial-border bg-surface-container-low p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-2xl">Fatura adresi</h2>
              <Check
                checked={billingSame}
                onChange={(v) => {
                  setBillingSame(v);
                  if (v) {
                    setBillingId(shippingId);
                    setBillingMode(shippingMode);
                  }
                }}
                label={
                  <span>
                    {isPickup ? "Ayrı fatura adresi istemiyorum" : "Teslimat ile aynı"}
                  </span>
                }
              />
            </div>
            {!billingSame ? (
              <>
                {addresses.length > 0 ? (
                  <div className="mb-6 space-y-2">
                    {addresses.map((addr) => {
                      const selected =
                        billingMode === "saved" && billingId === addr.id;
                      const live =
                        addresses.find((a) => a.id === addr.id) || addr;
                      return (
                        <div
                          key={`bill-${addr.id}`}
                          className={`border px-4 py-3 transition-colors ${
                            selected
                              ? "border-primary"
                              : "border-outline-variant/30 hover:border-outline"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectSavedBilling(addr)}
                            className={`w-full text-left font-meta text-[11px] uppercase ${
                              selected ? "text-primary" : "text-secondary"
                            }`}
                          >
                            <span className="font-medium">{addr.title}</span>
                            {live.isDefaultBilling ? " · varsayılan fatura" : ""}
                            <span className="mt-1 block normal-case tracking-normal text-secondary">
                              {addr.district}, {addr.city}
                            </span>
                          </button>
                          {selected && !live.isDefaultBilling ? (
                            <button
                              type="button"
                              disabled={defaultBusy}
                              onClick={() =>
                                void makeDefault(addr.id, "billing")
                              }
                              className="mt-3 font-meta text-[10px] uppercase text-secondary underline hover:text-primary disabled:opacity-50"
                            >
                              Varsayılan fatura yap
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={startNewBilling}
                      className={`w-full border px-4 py-3 text-left font-meta text-[11px] uppercase transition-colors ${
                        billingMode === "new"
                          ? "border-primary text-primary"
                          : "border-outline-variant/30 text-secondary hover:border-outline"
                      }`}
                    >
                      + Yeni fatura adresi
                    </button>
                  </div>
                ) : null}

                {billingMode === "saved" && billingId ? (
                  <SelectedAddressSummary
                    address={addresses.find((a) => a.id === billingId)}
                    fields={form.billing}
                    name={form.customerName}
                    phone={form.customerPhone}
                  />
                ) : (
                  <>
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label="Şehir"
                        value={form.billing.city}
                        onChange={(v) => setBillingField("city", v)}
                        required
                      />
                      <Field
                        label="İlçe"
                        value={form.billing.district}
                        onChange={(v) => setBillingField("district", v)}
                        required
                      />
                      <Field
                        label="Mahalle"
                        value={form.billing.neighborhood}
                        onChange={(v) => setBillingField("neighborhood", v)}
                      />
                      <Field
                        label="Posta Kodu"
                        value={form.billing.postalCode}
                        onChange={(v) => setBillingField("postalCode", v)}
                        required
                      />
                      <div className="md:col-span-2">
                        <Field
                          label="Adres"
                          value={form.billing.addressLine}
                          onChange={(v) => setBillingField("addressLine", v)}
                          required
                        />
                      </div>
                    </div>
                    {user ? (
                      <div className="mt-6 space-y-3 border-t border-outline-variant/20 pt-5">
                        <Check
                          checked={saveBillingAddress}
                          onChange={setSaveBillingAddress}
                          label={<span>Bu adresi adres defterime kaydet</span>}
                        />
                        {saveBillingAddress ? (
                          <>
                            <Field
                              label="Adres başlığı"
                              value={newBillingTitle}
                              onChange={setNewBillingTitle}
                              required
                            />
                            <Check
                              checked={defaultBillingOnSave}
                              onChange={setDefaultBillingOnSave}
                              label={
                                <span>
                                  Varsayılan fatura adresi olarak tanımla
                                </span>
                              }
                            />
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </>
            ) : (
              <p className="font-meta text-xs uppercase text-secondary">
                {isPickup
                  ? "Fatura için ayrı adres istenmeyecek."
                  : "Fatura bilgileri teslimat adresiyle aynı olacak."}
              </p>
            )}
          </section>
          </Reveal>

          {!isPickup ? (
          <Reveal variant="left" delay={160}>
          <section className="panel-motion industrial-border bg-surface-container-low p-6 md:p-8">
            <h2 className="mb-6 font-display text-2xl">Kargo Sağlayıcı</h2>
            <div className="space-y-3">
              {providers.map((p) => (
                <label
                  key={p.code}
                  className={`flex cursor-pointer items-center justify-between border px-4 py-4 font-meta text-xs uppercase ${
                    form.shippingProvider === p.code
                      ? "border-primary text-primary"
                      : "border-outline-variant/30 text-secondary"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={form.shippingProvider === p.code}
                      onChange={() => setField("shippingProvider", p.code)}
                    />
                    {p.name}
                  </span>
                  <span>{formatMoney(p.fee)}</span>
                </label>
              ))}
            </div>
          </section>
          </Reveal>
          ) : null}

        </div>

        <aside className="lg:col-span-4">
          {/* sticky: Reveal transform kullanma */}
          <div className="sticky top-28 z-10 border border-outline-variant/30 bg-surface-container-low p-6 panel-motion">
            <h2 className="mb-6 font-display text-2xl">Özet</h2>
            <div className="mb-6 space-y-2">
              <label className="field-label">Kupon kodu</label>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) =>
                    setCouponInput(e.target.value.toUpperCase())
                  }
                  disabled={Boolean(couponPreview?.valid)}
                  placeholder="HOSGELDIN10"
                  className="field-input flex-1 uppercase"
                />
                {couponPreview?.valid ? (
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="shrink-0 border border-outline-variant/40 px-3 font-meta text-[10px] uppercase"
                  >
                    Kaldır
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void applyCoupon()}
                    disabled={couponLoading}
                    className="shrink-0 border border-primary px-3 font-meta text-[10px] uppercase text-primary disabled:opacity-50"
                  >
                    {couponLoading ? "…" : "Uygula"}
                  </button>
                )}
              </div>
              {couponError ? (
                <p className="font-meta text-[10px] uppercase text-error">
                  {couponError}
                </p>
              ) : null}
              {couponPreview?.valid ? (
                <p className="font-meta text-[10px] uppercase text-primary">
                  {couponPreview.title || couponPreview.code} uygulandı
                </p>
              ) : null}
            </div>
            <div className="space-y-3 border-b border-outline-variant/20 pb-6 font-meta text-xs uppercase">
              <Row label="Ara Toplam" value={formatMoney(subtotal)} />
              {discountAmount > 0 ? (
                <Row
                  label={`İndirim (${couponPreview?.code})`}
                  value={`−${formatMoney(discountAmount)}`}
                />
              ) : null}
              <Row
                label={isPickup ? "Teslimat" : "Kargo"}
                value={
                  isPickup ? "Mağaza · Ücretsiz" : formatMoney(shippingFee)
                }
              />
              <Row
                label={`KDV (%${totals.ratePercent}${totals.taxIncluded ? " dahil" : ""})`}
                value={formatMoney(totals.taxAmount)}
              />
              <Row label="Toplam" value={formatMoney(total)} accent />
            </div>
            {error ? (
              <p className="mt-4 font-meta text-[11px] uppercase text-error">
                {error}
              </p>
            ) : null}
            <div className="mt-6 space-y-3 border-t border-outline-variant/20 pt-5 font-meta text-[10px] uppercase leading-relaxed text-secondary">
              <p className="font-meta text-[10px] tracking-widest text-on-surface-variant">
                Yasal onaylar
              </p>
              <Check
                checked={form.mesafeliSatis}
                onChange={(v) => setField("mesafeliSatis", v)}
                label={
                  <>
                    <Link href="/mesafeli-satis" className="text-primary underline">
                      Mesafeli satış sözleşmesini
                    </Link>{" "}
                    okudum, kabul ediyorum.
                  </>
                }
              />
              <Check
                checked={form.onBilgilendirme}
                onChange={(v) => setField("onBilgilendirme", v)}
                label={
                  <>
                    <Link href="/on-bilgilendirme" className="text-primary underline">
                      Ön bilgilendirme formunu
                    </Link>{" "}
                    okudum.
                  </>
                }
              />
              <Check
                checked={form.kvkk}
                onChange={(v) => setField("kvkk", v)}
                label={
                  <>
                    <Link href="/kvkk" className="text-primary underline">
                      KVKK
                    </Link>{" "}
                    metnini kabul ediyorum.{" "}
                    <Link href="/guvenli-alisveris" className="text-primary underline">
                      Güvenli alışveriş
                    </Link>{" "}
                    ve{" "}
                    <Link href="/iptal-iade" className="text-primary underline">
                      iade politikası
                    </Link>{" "}
                    bilgilendirmelerini okudum.
                  </>
                }
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-cta mt-5 w-full py-4 text-xs"
            >
              {submitting ? "Yönlendiriliyor…" : "PayTR ile Güvenli Öde"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function SelectedAddressSummary({
  address,
  fields,
  name,
  phone,
}: {
  address?: Address;
  fields: AddressFields;
  name: string;
  phone: string;
}) {
  return (
    <div className="border border-outline-variant/20 bg-surface-container px-4 py-4 font-meta text-xs leading-relaxed text-on-surface">
      {address ? (
        <p className="mb-2 text-[10px] uppercase tracking-widest text-primary">
          {address.title}
          {address.isDefaultShipping ? " · varsayılan teslimat" : ""}
          {address.isDefaultBilling ? " · varsayılan fatura" : ""}
        </p>
      ) : null}
      <p className="uppercase text-secondary">
        {name}
        {phone ? ` · ${phone}` : ""}
      </p>
      <p className="mt-2 normal-case tracking-normal">
        {fields.addressLine}
        <br />
        {fields.neighborhood ? `${fields.neighborhood}, ` : ""}
        {fields.district} / {fields.city}
        {fields.postalCode ? (
          <>
            <br />
            {fields.postalCode}
          </>
        ) : null}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
          checked
            ? "border-primary bg-primary text-on-primary"
            : "border-outline-variant/50"
        }`}
        aria-hidden
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6.2L4.6 9L10 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="square"
            />
          </svg>
        ) : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-secondary">{label}</span>
      <span className={accent ? "text-primary" : "text-on-surface"}>{value}</span>
    </div>
  );
}
