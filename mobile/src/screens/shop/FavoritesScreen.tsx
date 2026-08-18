import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AccountStackParamList } from '../../navigation/types';
import { shopToggleWishlist, shopWishlist } from '../../lib/shop-api';
import { formatMoney } from '../../lib/format';
import type { WishlistItem } from '../../lib/shop-types';
import { card, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Favorites'>;

export function FavoritesScreen({ navigation }: Props) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const load = useCallback(() => {
    void shopWishlist().then(setItems).catch(() => setItems([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={title}>Favoriler</Text>
      {!items.length ? <Text style={[muted, { marginTop: 16 }]}>Favori yok.</Text> : null}
      {items.map((w) => (
        <View key={w.id} style={card}>
          <Pressable
            onPress={() => {
              const slug = w.product?.slug;
              if (slug) {
                navigation.getParent()?.navigate('ShopTab', {
                  screen: 'Product',
                  params: { slug },
                } as never);
              }
            }}
          >
            <Text style={{ color: colors.text }}>{w.product?.name || w.productId}</Text>
            {w.product ? (
              <Text style={muted}>{formatMoney(w.product.salePrice ?? w.product.basePrice)}</Text>
            ) : null}
          </Pressable>
          <Pressable
            onPress={async () => {
              await shopToggleWishlist(w.productId);
              load();
            }}
          >
            <Text style={{ color: colors.danger, marginTop: 8 }}>Kaldır</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
