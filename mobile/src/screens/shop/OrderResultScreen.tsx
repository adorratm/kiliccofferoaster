import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CartStackParamList } from '../../navigation/types';
import { useShopCart } from '../../lib/shop-cart';
import { btn, btnText, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'OrderResult'>;

export function OrderResultScreen({ navigation, route }: Props) {
  const { refresh } = useShopCart();
  const { ok, orderNumber, message } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderWidth: 1,
          borderColor: ok ? colors.success : colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Feather name={ok ? 'check' : 'x'} size={28} color={ok ? colors.success : colors.danger} />
      </View>
      <Text style={title}>{ok ? 'Sipariş alındı' : 'Ödeme başarısız'}</Text>
      {orderNumber ? (
        <Text style={[muted, { marginTop: 12, letterSpacing: 1 }]}>Sipariş no {orderNumber}</Text>
      ) : null}
      {message ? <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 22 }}>{message}</Text> : null}
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
