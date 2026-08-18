import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CartStackParamList } from '../../navigation/types';
import { useShopCart } from '../../lib/shop-cart';
import {
  cartSubtotal,
  shopCheckout,
  shopMe,
  shopShippingProviders,
  shopValidateCoupon,
} from '../../lib/shop-api';
import { getShopToken, SHOP_URL } from '../../lib/api';
import { calculateOrderTotals, formatMoney } from '../../lib/format';
import type { CouponPreview, ShippingProvider } from '../../lib/shop-types';
import { btn, btnText, colors, input, muted, title } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  const { cart, refresh } = useShopCart();
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    city: '',
    district: '',
    neighborhood: '',
    addressLine: '',
    postalCode: '',
    shippingProvider: '',
    mesafeliSatis: false,
    onBilgilendirme: false,
    kvkk: false,
    notes: '',
  });

  useEffect(() => {
    void (async () => {
      await refresh();
      const [prov, token] = await Promise.all([
        shopShippingProviders(),
        getShopToken(),
      ]);
      setProviders(prov);
      setForm((f) => ({
        ...f,
        shippingProvider: f.shippingProvider || prov[0]?.code || '',
      }));
      if (token) {
        try {
          const me = await shopMe();
          setForm((f) => ({
            ...f,
            customerEmail: me.email || f.customerEmail,
            customerName:
              [me.firstName, me.lastName].filter(Boolean).join(' ') || f.customerName,
            customerPhone: me.phone || f.customerPhone,
          }));
        } catch {
          /* misafir */
        }
      }
      setLoading(false);
    })();
  }, [refresh]);

  const subtotal = cartSubtotal(cart);
  const selected = providers.find((p) => p.code === form.shippingProvider);
  const shippingFee = Number(selected?.fee || 0);
  const totals = calculateOrderTotals(
    subtotal,
    shippingFee,
    coupon?.valid ? Number(coupon.discountAmount) : 0,
  );

  async function applyCoupon() {
    setError('');
    try {
      const preview = await shopValidateCoupon(couponInput, subtotal, form.customerEmail);
      setCoupon(preview);
      if (!preview.valid) setError(preview.message || 'Kupon geçersiz');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kupon doğrulanamadı');
    }
  }

  async function submit() {
    setError('');
    if (!cart?.items?.length) {
      setError('Sepet boş');
      return;
    }
    if (!form.mesafeliSatis || !form.onBilgilendirme || !form.kvkk) {
      setError('Yasal onayları işaretleyin');
      return;
    }
    setSubmitting(true);
    try {
      const addr = {
        fullName: form.customerName,
        phone: form.customerPhone,
        city: form.city,
        district: form.district,
        neighborhood: form.neighborhood,
        addressLine: form.addressLine,
        postalCode: form.postalCode,
      };
      const result = await shopCheckout({
        customerEmail: form.customerEmail,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        shippingAddress: addr,
        billingAddress: addr,
        shippingProvider: form.shippingProvider,
        couponCode: coupon?.valid ? coupon.code : undefined,
        legalAcceptances: {
          mesafeliSatis: form.mesafeliSatis,
          onBilgilendirme: form.onBilgilendirme,
          kvkk: form.kvkk,
        },
        notes: form.notes || undefined,
      });
      await refresh();
      if (result.mock || (!result.token && !result.iframeUrl && !result.paymentPageUrl)) {
        navigation.replace('OrderResult', {
          ok: true,
          orderNumber: result.orderNumber,
        });
        return;
      }
      const payUrl = result.iframeUrl || undefined;
      const token = result.token;
      if (token || payUrl) {
        navigation.navigate('Paytr', {
          token: token || '',
          iframeUrl: payUrl,
          orderNumber: result.orderNumber,
          orderId: result.orderId,
        });
        return;
      }
      setError('Ödeme oturumu alınamadı');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ödeme başlatılamadı');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      <Text style={title}>Ödeme</Text>
      <Field label="Ad soyad" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} />
      <Field label="E-posta" value={form.customerEmail} onChange={(v) => setForm({ ...form, customerEmail: v })} keyboard="email-address" />
      <Field label="Telefon" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} keyboard="phone-pad" />
      <Field label="İl" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
      <Field label="İlçe" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
      <Field label="Mahalle" value={form.neighborhood} onChange={(v) => setForm({ ...form, neighborhood: v })} />
      <Field label="Adres" value={form.addressLine} onChange={(v) => setForm({ ...form, addressLine: v })} />
      <Field label="Posta kodu" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} keyboard="number-pad" />

      <Text style={[muted, { marginTop: 20 }]}>KARGO</Text>
      {providers.map((p) => (
        <Pressable
          key={p.code}
          onPress={() => setForm({ ...form, shippingProvider: p.code })}
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: form.shippingProvider === p.code ? colors.accent : colors.border,
            padding: 12,
          }}
        >
          <Text style={{ color: colors.text }}>
            {p.name} · {formatMoney(p.fee)}
          </Text>
        </Pressable>
      ))}

      <Text style={[muted, { marginTop: 20 }]}>KUPON</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TextInput
          value={couponInput}
          onChangeText={setCouponInput}
          autoCapitalize="characters"
          placeholder="Kod"
          placeholderTextColor={colors.muted}
          style={[input, { flex: 1, marginTop: 0 }]}
        />
        <Pressable onPress={() => void applyCoupon()} style={{ justifyContent: 'center' }}>
          <Text style={{ color: colors.accentSoft }}>Uygula</Text>
        </Pressable>
      </View>
      {coupon?.valid ? (
        <Text style={{ color: colors.success, marginTop: 6 }}>
          {coupon.code} · −{formatMoney(coupon.discountAmount)}
        </Text>
      ) : null}

      <Legal
        label="Mesafeli satış sözleşmesi"
        href="/mesafeli-satis"
        value={form.mesafeliSatis}
        onChange={(v) => setForm({ ...form, mesafeliSatis: v })}
      />
      <Legal
        label="Ön bilgilendirme"
        href="/on-bilgilendirme"
        value={form.onBilgilendirme}
        onChange={(v) => setForm({ ...form, onBilgilendirme: v })}
      />
      <Legal
        label="KVKK"
        href="/kvkk"
        value={form.kvkk}
        onChange={(v) => setForm({ ...form, kvkk: v })}
      />

      <Text style={{ color: colors.text, marginTop: 16 }}>
        Toplam {formatMoney(totals.total)}
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      <Pressable
        onPress={() => void submit()}
        disabled={submitting}
        style={[btn, { opacity: submitting ? 0.6 : 1 }]}
      >
        <Text style={btnText}>{submitting ? 'Gönderiliyor…' : 'Ödemeyi başlat'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'email-address' | 'phone-pad' | 'number-pad';
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={muted}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        style={input}
      />
    </View>
  );
}

function Legal({
  label,
  href,
  value,
  onChange,
}: {
  label: string;
  href: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
      <Pressable
        onPress={() =>
          void Linking.openURL(`${SHOP_URL.replace(/\/$/, '')}${href}`)
        }
        style={{ flex: 1, marginRight: 12 }}
      >
        <Text style={{ color: colors.accentSoft }}>{label}</Text>
      </Pressable>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
  );
}
