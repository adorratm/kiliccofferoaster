import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { CartStackParamList } from '../../navigation/types';
import { useShopCart } from '../../lib/shop-cart';
import {
  cartSubtotal,
  shopRemoveCartItem,
  shopUpdateCartItem,
} from '../../lib/shop-api';
import { formatMoney } from '../../lib/format';
import { grindLabel } from '../../lib/grind';
import { btn, btnText, card, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { cart, refresh } = useShopCart();
  const [msg, setMsg] = useState('');

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const items = cart?.items ?? [];
  const subtotal = cartSubtotal(cart);

  async function changeQty(id: string, quantity: number) {
    try {
      if (quantity < 1) await shopRemoveCartItem(id);
      else await shopUpdateCartItem(id, quantity);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void refresh()} tintColor={colors.accent} />
      }
    >
      <Text style={title}>Sepet</Text>
      {msg ? <Text style={{ color: colors.danger, marginTop: 8 }}>{msg}</Text> : null}
      {!items.length ? (
        <Text style={[muted, { marginTop: 24 }]}>Sepetiniz boş.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={card}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>
              {item.product?.name || 'Ürün'}
            </Text>
            <Text style={muted}>
              {item.variant?.weightLabel || ''}
              {item.grindOption ? ` · ${grindLabel(item.grindOption)}` : ''}
            </Text>
            <Text style={{ color: colors.accentSoft, marginTop: 6 }}>
              {formatMoney(Number(item.unitPrice) * item.quantity)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 16 }}>
              <Pressable onPress={() => void changeQty(item.id, item.quantity - 1)}>
                <Text style={{ color: colors.accentSoft, fontSize: 20 }}>−</Text>
              </Pressable>
              <Text style={{ color: colors.text }}>{item.quantity}</Text>
              <Pressable onPress={() => void changeQty(item.id, item.quantity + 1)}>
                <Text style={{ color: colors.accentSoft, fontSize: 20 }}>+</Text>
              </Pressable>
              <Pressable onPress={() => void changeQty(item.id, 0)}>
                <Text style={{ color: colors.danger }}>Kaldır</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
      {items.length ? (
        <>
          <Text style={{ color: colors.text, marginTop: 20, fontSize: 18 }}>
            Ara toplam {formatMoney(subtotal)}
          </Text>
          <Pressable onPress={() => navigation.navigate('Checkout')} style={btn}>
            <Text style={btnText}>Ödemeye geç</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}
