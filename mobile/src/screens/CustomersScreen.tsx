import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { RootStack } from '../../App';
import { api, asArray } from '../lib/api';
import { card, colors, input, muted, screen, title } from '../ui';

type Row = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
};

type Props = NativeStackScreenProps<RootStack, 'Customers'>;

function displayName(row: Row) {
  return [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email;
}

export function CustomersScreen({ navigation }: Props) {
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const params = new URLSearchParams({ limit: '50', page: '1' });
    if (q.trim()) params.set('q', q.trim());
    const data = await api<unknown>(`/admin/customers?${params}`);
    setItems(asArray<Row>(data));
  }

  useEffect(() => {
    void load().catch(() => setError('Müşteriler yüklenemedi'));
  }, []);

  return (
    <ScrollView style={screen} keyboardShouldPersistTaps="handled">
      <Text style={title}>Müşteriler</Text>
      <TextInput
        placeholder="Ad, e-posta, telefon"
        placeholderTextColor={colors.muted}
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => void load()}
        autoCapitalize="none"
        style={input}
      />
      <Pressable onPress={() => void load()} style={{ marginTop: 8 }}>
        <Text style={{ color: colors.accentSoft }}>Ara</Text>
      </Pressable>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {items.map((c) => (
        <Pressable
          key={c.id}
          style={card}
          onPress={() => navigation.navigate('CustomerDetail', { id: c.id })}
        >
          <Text style={{ color: colors.text }}>{displayName(c)}</Text>
          <Text style={muted}>{c.email}</Text>
          <Text style={muted}>
            {c.orderCount} sipariş · {c.totalSpent} ₺ · {c.isActive ? 'aktif' : 'pasif'}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

type DetailProps = NativeStackScreenProps<RootStack, 'CustomerDetail'>;

type Detail = {
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    provider: string;
    isActive: boolean;
  };
  stats: { orderCount: number; totalSpent: number; addressCount: number; returnCount: number };
  addresses: {
    id: string;
    title: string;
    fullName: string;
    phone: string;
    addressLine: string;
    district: string;
    city: string;
    postalCode: string;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    total: string | number;
    items?: { id: string; productName: string; quantity: number }[];
    shipments?: { id: string; provider: string; status: string; trackingNumber?: string | null }[];
  }[];
  guestOrders: Detail['orders'];
  returns: { id: string; orderNumber: string | null; type: string; status: string; reason: string }[];
};

export function CustomerDetailScreen({ route }: DetailProps) {
  const { id } = route.params;
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<Detail>(`/admin/customers/${id}`)
      .then(setData)
      .catch(() => setError('Müşteri yüklenemedi'));
  }, [id]);

  if (error) {
    return (
      <View style={screen}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={screen}>
        <Text style={muted}>Yükleniyor…</Text>
      </View>
    );
  }

  const name =
    [data.user.firstName, data.user.lastName].filter(Boolean).join(' ') || data.user.email;
  const orders = [...data.orders, ...data.guestOrders];

  return (
    <ScrollView style={screen}>
      <Text style={title}>{name}</Text>
      <Text style={muted}>{data.user.email}</Text>
      <Text style={muted}>{data.user.phone || 'Telefon yok'} · {data.user.provider}</Text>
      <Text style={[muted, { marginTop: 8 }]}>
        {data.stats.orderCount} sipariş · {data.stats.totalSpent} ₺ · {data.stats.addressCount} adres
      </Text>

      <Text style={[muted, { marginTop: 20, letterSpacing: 2 }]}>ADRESLER</Text>
      {data.addresses.length ? (
        data.addresses.map((a) => (
          <View key={a.id} style={card}>
            <Text style={{ color: colors.text }}>{a.title} · {a.fullName}</Text>
            <Text style={muted}>{a.phone}</Text>
            <Text style={muted}>{a.addressLine}</Text>
            <Text style={muted}>{[a.district, a.city, a.postalCode].filter(Boolean).join(' / ')}</Text>
          </View>
        ))
      ) : (
        <Text style={[muted, { marginTop: 8 }]}>Kayıtlı adres yok</Text>
      )}

      <Text style={[muted, { marginTop: 20, letterSpacing: 2 }]}>SİPARİŞ / KARGO</Text>
      {orders.length ? (
        orders.map((o) => (
          <View key={o.id} style={card}>
            <Text style={{ color: colors.text }}>
              {o.orderNumber} · {o.status} · {o.total} ₺
            </Text>
            {(o.items || []).map((item) => (
              <Text key={item.id} style={muted}>
                {item.productName} × {item.quantity}
              </Text>
            ))}
            {(o.shipments || []).map((s) => (
              <Text key={s.id} style={muted}>
                Kargo: {s.provider} · {s.status}
                {s.trackingNumber ? ` · ${s.trackingNumber}` : ''}
              </Text>
            ))}
          </View>
        ))
      ) : (
        <Text style={[muted, { marginTop: 8 }]}>Sipariş yok</Text>
      )}

      {data.returns.length ? (
        <>
          <Text style={[muted, { marginTop: 20, letterSpacing: 2 }]}>İADELER</Text>
          {data.returns.map((r) => (
            <View key={r.id} style={card}>
              <Text style={{ color: colors.text }}>
                {r.orderNumber} · {r.type} · {r.status}
              </Text>
              <Text style={muted}>{r.reason}</Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}
