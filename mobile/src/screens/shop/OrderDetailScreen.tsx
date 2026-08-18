import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { shopOrder } from '../../lib/shop-api';
import { formatMoney } from '../../lib/format';
import type { Order } from '../../lib/shop-types';
import { card, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'OrderDetail'>;

export function OrderDetailScreen({ route }: Props) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    void shopOrder(route.params.id).then(setOrder).catch(() => setOrder(null));
  }, [route.params.id]);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
        <Text style={muted}>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={title}>{order.orderNumber}</Text>
      <Text style={[muted, { marginTop: 8 }]}>{order.status}</Text>
      {order.items?.map((item) => (
        <View key={item.id} style={card}>
          <Text style={{ color: colors.text }}>{item.productName}</Text>
          <Text style={muted}>
            {item.quantity} × {formatMoney(item.unitPrice)}
          </Text>
        </View>
      ))}
      <Text style={{ color: colors.accentSoft, marginTop: 16 }}>
        Toplam {formatMoney(order.total, order.currency)}
      </Text>
    </ScrollView>
  );
}
