import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/types';
import { shopCategories, shopProducts } from '../../lib/shop-api';
import type { Category, Product } from '../../lib/shop-types';
import { colors, muted, title } from '../../ui';
import { ProductCard } from './ProductCard';

type Props = NativeStackScreenProps<ShopStackParamList, 'ShopHome'>;

export function ShopHomeScreen({ navigation }: Props) {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [feat, all, cats] = await Promise.all([
        shopProducts({ featured: true, limit: 8 }),
        shopProducts({ limit: 12 }),
        shopCategories(),
      ]);
      setFeatured(feat.items);
      setLatest(all.items);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mağaza yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.accent} />
      }
    >
      <Text style={muted}>KILIÇ COFFEE ROASTER</Text>
      <Text style={[title, { marginTop: 6 }]}>Mağaza</Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}

      <Pressable
        onPress={() => navigation.navigate('ShopSearch')}
        style={{
          marginTop: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: colors.muted }}>Kahve ara…</Text>
      </Pressable>

      {categories.length ? (
        <>
          <Text style={[muted, { marginTop: 24, letterSpacing: 2 }]}>KATEGORİLER</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => navigation.navigate('Catalog', { categorySlug: c.slug })}
                style={{
                  marginRight: 8,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.accentSoft }}>{c.name}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => navigation.navigate('Catalog', {})}
              style={{
                marginRight: 8,
                marginTop: 8,
                backgroundColor: colors.accent,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#fff' }}>Tümü</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {featured.length ? (
        <>
          <Text style={[muted, { marginTop: 24, letterSpacing: 2 }]}>ÖNE ÇIKANLAR</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            {featured.map((p) => (
              <View key={p.id} style={{ width: '50%' }}>
                <ProductCard
                  product={p}
                  onPress={() => navigation.navigate('Product', { slug: p.slug })}
                />
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={[muted, { marginTop: 24, letterSpacing: 2 }]}>KAHVELER</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
        {latest.map((p) => (
          <View key={p.id} style={{ width: '50%' }}>
            <ProductCard
              product={p}
              onPress={() => navigation.navigate('Product', { slug: p.slug })}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
