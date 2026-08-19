import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ShopStackParamList } from '../../navigation/types';
import { Chip } from '../../components/shop/Chip';
import { ExploreTile } from '../../components/shop/ExploreTile';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SearchBar } from '../../components/shop/SearchBar';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { shopCategories, shopProducts } from '../../lib/shop-api';
import type { Category, Product } from '../../lib/shop-types';
import { colors } from '../../ui';
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

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.accent} />
      }
    >
      <PageHeader
        kicker="01 // Kavrum"
        heading="Mağaza"
        subtitle="Torbalı’dan taze kavrulmuş specialty coffee. Batch bazlı, izlenebilir çekirdek."
      />
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}

      <SearchBar
        placeholder="Kahve, köken, kavrum ara…"
        editable={false}
        onPress={() => navigation.navigate('ShopSearch')}
      />

      {categories.length ? (
        <>
          <SectionLabel index="02" label="Kategoriler" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            <Chip filled label="Tümü" onPress={() => navigation.navigate('Catalog', {})} />
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                onPress={() => navigation.navigate('Catalog', { categorySlug: c.slug })}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {featured.length ? (
        <>
          <SectionLabel index="03" label="Öne çıkanlar" />
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

      <SectionLabel index="04" label="Kahveler" />
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
      <Pressable onPress={() => navigation.navigate('Catalog', {})} style={{ marginTop: 8, paddingVertical: 12 }}>
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
          Tüm kataloğu gör
        </Text>
      </Pressable>

      <SectionLabel index="05" label="Keşfet" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <ExploreTile
          icon="info"
          label="Hakkımızda"
          hint="Atölye ve kavrum"
          onPress={() => navigation.navigate('About')}
        />
        <ExploreTile
          icon="book-open"
          label="Blog"
          hint="Notlar ve profiller"
          onPress={() => navigation.navigate('BlogList')}
        />
        <ExploreTile
          icon="help-circle"
          label="SSS"
          hint="Kargo ve öğütme"
          onPress={() => navigation.navigate('Faq')}
        />
        <ExploreTile
          icon="map-pin"
          label="İletişim"
          hint="Torbalı / İzmir"
          onPress={() => navigation.navigate('Contact')}
        />
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
