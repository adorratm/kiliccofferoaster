import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CartStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { useShopCart } from '../../lib/shop-cart';
import {
  cartSubtotal,
  shopCheckout,
  shopMe,
  shopShippingProviders,
  shopValidateCoupon,
} from '../../lib/shop-api';
import { getShopToken } from '../../lib/api';
import { calculateOrderTotals, formatMoney } from '../../lib/format';
import type { CouponPreview, ShippingProvider } from '../../lib/shop-types';
import { btn, btnText, colors, input, muted } from '../../ui';

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

  if (loading) return <ScreenLoader />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader kicker="Ödeme" heading="Teslimat" subtitle="Adres, kargo ve yasal onaylar." />

      <SectionLabel index="01" label="İletişim" />
      <Field title="Ad soyad" value={form.customerName} onChangeText={(customerName) => setForm({ ...form, customerName })} />
      <Field
        title="E-posta"
        value={form.customerEmail}
        onChangeText={(customerEmail) => setForm({ ...form, customerEmail })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        title="Telefon"
        value={form.customerPhone}
        onChangeText={(customerPhone) => setForm({ ...form, customerPhone })}
        keyboardType="phone-pad"
      />

      <SectionLabel index="02" label="Adres" />
      <Field title="İl" value={form.city} onChangeText={(city) => setForm({ ...form, city })} />
      <Field title="İlçe" value={form.district} onChangeText={(district) => setForm({ ...form, district })} />
      <Field title="Mahalle" value={form.neighborhood} onChangeText={(neighborhood) => setForm({ ...form, neighborhood })} />
      <Field title="Adres" value={form.addressLine} onChangeText={(addressLine) => setForm({ ...form, addressLine })} multiline />
      <Field
        title="Posta kodu"
        value={form.postalCode}
        onChangeText={(postalCode) => setForm({ ...form, postalCode })}
        keyboardType="number-pad"
      />

      <SectionLabel index="03" label="Kargo" />
      {providers.map((p) => (
        <Pressable
          key={p.code}
          onPress={() => setForm({ ...form, shippingProvider: p.code })}
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: form.shippingProvider === p.code ? colors.accent : colors.borderMuted,
            backgroundColor: form.shippingProvider === p.code ? colors.surfaceHigh : colors.surface,
            padding: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>{p.name}</Text>
          <Text style={{ color: colors.accentSoft }}>{formatMoney(p.fee)}</Text>
        </Pressable>
      ))}

      <SectionLabel index="04" label="Kupon" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <TextInput
          value={couponInput}
          onChangeText={setCouponInput}
          autoCapitalize="characters"
          placeholder="Kod"
          placeholderTextColor={colors.muted}
          style={[input, { flex: 1, marginTop: 0, marginRight: 10 }]}
        />
        <Pressable onPress={() => void applyCoupon()} style={{ paddingVertical: 14, paddingHorizontal: 8 }}>
          <Text style={{ color: colors.accentSoft, fontWeight: '700', letterSpacing: 1 }}>UYGULA</Text>
        </Pressable>
      </View>
      {coupon?.valid ? (
        <Text style={{ color: colors.success, marginTop: 8 }}>
          {coupon.code} · −{formatMoney(coupon.discountAmount)}
        </Text>
      ) : null}

      <SectionLabel index="05" label="Onaylar" />
      <Legal
        label="Mesafeli satış sözleşmesi"
        value={form.mesafeliSatis}
        onChange={(v) => setForm({ ...form, mesafeliSatis: v })}
        onOpen={() => navigation.navigate('Legal', { slug: 'mesafeli-satis' })}
      />
      <Legal
        label="Ön bilgilendirme"
        value={form.onBilgilendirme}
        onChange={(v) => setForm({ ...form, onBilgilendirme: v })}
        onOpen={() => navigation.navigate('Legal', { slug: 'on-bilgilendirme' })}
      />
      <Legal
        label="KVKK"
        value={form.kvkk}
        onChange={(v) => setForm({ ...form, kvkk: v })}
        onOpen={() => navigation.navigate('Legal', { slug: 'kvkk' })}
      />

      <View
        style={{
          marginTop: 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: 16,
        }}
      >
        <Row label="Ara toplam" value={formatMoney(totals.subtotal)} />
        <Row label="Kargo" value={formatMoney(totals.shippingFee)} />
        {totals.discountAmount ? <Row label="İndirim" value={`−${formatMoney(totals.discountAmount)}`} /> : null}
        <View style={{ height: 1, backgroundColor: colors.borderMuted, marginVertical: 12 }} />
        <Row label="Toplam" value={formatMoney(totals.total)} strong />
      </View>

      {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: strong ? 0 : 6 }}>
      <Text style={strong ? { color: colors.text, fontWeight: '700' } : muted}>{label}</Text>
      <Text style={{ color: strong ? colors.accentSoft : colors.text, fontWeight: strong ? '700' : '400', fontSize: strong ? 18 : 14 }}>
        {value}
      </Text>
    </View>
  );
}

function Legal({
  label,
  value,
  onChange,
  onOpen,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: colors.borderMuted,
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <Pressable onPress={onOpen} style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: colors.accentSoft, fontSize: 13 }}>{label}</Text>
        <Text style={[muted, { marginTop: 2, fontSize: 10 }]}>Metni oku</Text>
      </Pressable>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
  );
}
