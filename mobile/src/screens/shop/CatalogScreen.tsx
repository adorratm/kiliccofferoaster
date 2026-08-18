import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/types';
import { shopProducts } from '../../lib/shop-api';
import type { Product } from '../../lib/shop-types';
import { colors, muted } from '../../ui';
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
      <View style={{ padding: 16 }}>
        <TextInput
          placeholder="Ara"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => setAppliedQ(q)}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            padding: 12,
          }}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={[muted, { textAlign: 'center', marginTop: 24 }]}>Ürün bulunamadı</Text>
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
        style={{ padding: 12 }}
      >
        <Text style={{ color: colors.accentSoft, textAlign: 'center' }}>Yenile</Text>
      </Pressable>
    </View>
  );
}
