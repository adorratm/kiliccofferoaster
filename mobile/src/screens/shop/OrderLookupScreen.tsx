import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { StatusBadge } from '../../components/shop/StatusBadge';
import { shopLookupOrder } from '../../lib/shop-api';
import type { GuestOrderLookup } from '../../lib/shop-types';
import { formatMoney } from '../../lib/format';
import { btn, btnText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'OrderLookup'>;

export function OrderLookupScreen({ navigation }: Props) {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GuestOrderLookup | null>(null);

  async function submit() {
    setError('');
    setResult(null);
    setBusy(true);
    try {
      setResult(await shopLookupOrder(orderNumber, email));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sorgulanamadı');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader
        kicker="Destek"
        heading="Sipariş sorgula"
        subtitle="Sipariş numarası ve ödeme e-postası ile durumu görün."
      />
      <Field
        title="Sipariş no"
        value={orderNumber}
        onChangeText={(v) => setOrderNumber(v.toUpperCase())}
        placeholder="KLC-…"
        autoCapitalize="characters"
      />
      <Field
        title="E-posta"
        value={email}
        onChangeText={setEmail}
        placeholder="Siparişte kullandığınız e-posta"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
      <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
        <Text style={btnText}>{busy ? 'Sorgulanıyor…' : 'Sorgula'}</Text>
      </Pressable>

      {result ? (
        <View
          style={{
            marginTop: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 18 }}>{result.orderNumber}</Text>
          <View style={{ marginTop: 10 }}>
            <StatusBadge status={result.status} />
          </View>
          <Text style={{ color: colors.accentSoft, marginTop: 12, fontWeight: '600' }}>
            {formatMoney(result.total, result.currency || 'TRY')}
          </Text>
          {result.items?.map((item) => (
            <Text key={item.id} style={[muted, { marginTop: 8 }]}>
              {item.productName}
              {item.variantLabel ? ` · ${item.variantLabel}` : ''} × {item.quantity}
            </Text>
          ))}
          {result.shipments?.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                if (s.trackingNumber) {
                  navigation.navigate('TrackingResult', { kod: s.trackingNumber });
                }
              }}
              style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderMuted }}
            >
              <StatusBadge status={s.status} kind="shipment" />
              <Text style={{ color: colors.accentSoft, marginTop: 8 }}>
                {s.trackingNumber ? `Takip ${s.trackingNumber}` : 'Takip kodu yok'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
