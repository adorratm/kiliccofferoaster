import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import type { CartStackParamList } from '../../navigation/types';
import { useShopCart } from '../../lib/shop-cart';
import { btn, btnText, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'OrderResult'>;

export function OrderResultScreen({ navigation, route }: Props) {
  const { refresh } = useShopCart();
  const { ok, orderNumber, message } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
      <Text style={title}>{ok ? 'Sipariş alındı' : 'Ödeme başarısız'}</Text>
      {orderNumber ? (
        <Text style={[muted, { marginTop: 12 }]}>Sipariş no: {orderNumber}</Text>
      ) : null}
      {message ? <Text style={{ color: colors.muted, marginTop: 8 }}>{message}</Text> : null}
      <Pressable
        onPress={() => {
          void refresh();
          navigation.popToTop();
        }}
        style={btn}
      >
        <Text style={btnText}>{ok ? 'Sepete dön' : 'Tekrar dene'}</Text>
      </Pressable>
    </View>
  );
}
