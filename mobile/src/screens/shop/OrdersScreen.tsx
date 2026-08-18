import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AccountStackParamList } from '../../navigation/types';
import { shopOrders } from '../../lib/shop-api';
import { formatMoney } from '../../lib/format';
import type { Order } from '../../lib/shop-types';
import { card, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Orders'>;

export function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);

  useFocusEffect(
    useCallback(() => {
      void shopOrders().then(setOrders).catch(() => setOrders([]));
    }, []),
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={title}>Siparişler</Text>
      {!orders.length ? <Text style={[muted, { marginTop: 16 }]}>Sipariş yok.</Text> : null}
      {orders.map((o) => (
        <Pressable key={o.id} onPress={() => navigation.navigate('OrderDetail', { id: o.id })} style={card}>
          <Text style={{ color: colors.text }}>{o.orderNumber}</Text>
          <Text style={muted}>
            {o.status} · {formatMoney(o.total, o.currency)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
