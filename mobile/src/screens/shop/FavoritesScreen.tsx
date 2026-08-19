import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AccountStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { PageHeader } from '../../components/shop/PageHeader';
import { RemoteImage } from '../../components/shop/RemoteImage';
import { shopToggleWishlist, shopWishlist } from '../../lib/shop-api';
import { formatMoney } from '../../lib/format';
import type { WishlistItem } from '../../lib/shop-types';
import { colors } from '../../ui';

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
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <PageHeader kicker="Hesap" heading="Favoriler" subtitle="Kaydettiğiniz kahveler." />
      {!items.length ? (
        <EmptyState icon="heart" title="Favori yok" body="Ürün sayfasından kalp ile kaydedin." />
      ) : null}
      {items.map((w) => (
          <View
            key={w.id}
            style={{
              marginTop: 10,
              borderWidth: 1,
              borderColor: colors.borderMuted,
              backgroundColor: colors.surface,
              padding: 12,
              flexDirection: 'row',
            }}
          >
            <RemoteImage
              uri={w.product?.imageUrl}
              seed={w.product?.slug}
              width={72}
              height={88}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
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
                <Text style={{ color: colors.text, fontWeight: '700' }}>{w.product?.name || w.productId}</Text>
                {w.product ? (
                  <Text style={{ color: colors.accentSoft, marginTop: 6 }}>
                    {formatMoney(w.product.salePrice ?? w.product.basePrice)}
                  </Text>
                ) : null}
              </Pressable>
              <Pressable
                onPress={async () => {
                  await shopToggleWishlist(w.productId);
                  load();
                }}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: colors.danger, fontSize: 12, letterSpacing: 0.6 }}>Kaldır</Text>
              </Pressable>
            </View>
          </View>
      ))}
    </ScrollView>
  );
}
