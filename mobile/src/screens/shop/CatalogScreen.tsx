import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SearchBar } from '../../components/shop/SearchBar';
import { shopProducts } from '../../lib/shop-api';
import type { Product } from '../../lib/shop-types';
import { colors } from '../../ui';
import { ProductCard } from './ProductCard';

type Props = NativeStackScreenProps<ShopStackParamList, 'Catalog'>;

export function CatalogScreen({ navigation, route }: Props) {
  const categorySlug = route.params?.categorySlug;
  const initialQ = route.params?.q ?? '';
  const [q, setQ] = useState(initialQ);
  const [appliedQ, setAppliedQ] = useState(initialQ);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await shopProducts({
        q: appliedQ.trim() || undefined,
        categorySlug,
        sort: 'name',
        order: 'asc',
        limit: 40,
      });
      setItems(page.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, appliedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <SearchBar
          value={q}
          placeholder="Katalogda ara"
          onChangeText={setQ}
          onSubmit={() => setAppliedQ(q)}
        />
      </View>
      {loading ? (
        <ScreenLoader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 40 }}
          ListEmptyComponent={
            <EmptyState
              icon="coffee"
              title="Ürün bulunamadı"
              body="Farklı bir arama veya kategori deneyin."
            />
          }
          renderItem={({ item }) => (
            <View style={{ width: '50%' }}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('Product', { slug: item.slug })}
              />
            </View>
          )}
        />
      )}
      <Pressable
        onPress={() => {
          if (q === appliedQ) void load();
          else setAppliedQ(q);
        }}
        style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.borderMuted }}
      >
        <Text
          style={{
            color: colors.accentSoft,
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            fontWeight: '700',
          }}
        >
          Yenile
        </Text>
      </Pressable>
    </View>
  );
}
