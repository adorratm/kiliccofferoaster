import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { AccountStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { PageHeader } from '../../components/shop/PageHeader';
import { StatusBadge } from '../../components/shop/StatusBadge';
import { shopOrders } from '../../lib/shop-api';
import { formatMoney } from '../../lib/format';
import type { Order } from '../../lib/shop-types';
import { colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Orders'>;

function formatDate(value?: string) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(value),
    );
  } catch {
    return '';
  }
}

export function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);

  useFocusEffect(
    useCallback(() => {
      void shopOrders().then(setOrders).catch(() => setOrders([]));
    }, []),
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <PageHeader kicker="Hesap" heading="Siparişler" subtitle="Kavrum sırası ve kargo durumu." />
      {!orders.length ? (
        <EmptyState icon="package" title="Sipariş yok" body="İlk kavrum siparişiniz burada görünecek." />
      ) : null}
      {orders.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surface,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '700', letterSpacing: 0.4 }}>{o.orderNumber}</Text>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <StatusBadge status={o.status} />
            <Text style={{ color: colors.accentSoft, fontWeight: '600' }}>{formatMoney(o.total, o.currency)}</Text>
          </View>
          {o.createdAt ? <Text style={[muted, { marginTop: 10 }]}>{formatDate(o.createdAt)}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}
