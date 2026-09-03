import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SearchBar } from '../../components/shop/SearchBar';
import { shopBlog, shopCategories, shopProducts } from '../../lib/shop-api';
import { stripHtml } from '../../lib/catalog-seo';
import type { BlogPost, Category, Product } from '../../lib/shop-types';
import { colors, muted } from '../../ui';
import { ProductCard } from './ProductCard';

type Props = NativeStackScreenProps<ShopStackParamList, 'Catalog'>;

export function CatalogScreen({ navigation, route }: Props) {
  const categorySlug = route.params?.categorySlug;
  const initialQ = route.params?.q ?? '';
  const [q, setQ] = useState(initialQ);
  const [appliedQ, setAppliedQ] = useState(initialQ);
  const [items, setItems] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedBlog, setRelatedBlog] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [page, cats] = await Promise.all([
        shopProducts({
          q: appliedQ.trim() || undefined,
          categorySlug,
          sort: 'name',
          order: 'asc',
          limit: 40,
        }),
        categorySlug ? shopCategories().catch(() => []) : Promise.resolve([]),
      ]);
      setItems(page.items);
      const match = cats.find((c) => c.slug === categorySlug) || null;
      setCategory(match);
      if (categorySlug) {
        const posts = await shopBlog({ categorySlug, limit: 3 }).catch(() => null);
        setRelatedBlog(posts?.items ?? []);
      } else {
        setRelatedBlog([]);
      }
    } catch {
      setItems([]);
      setCategory(null);
      setRelatedBlog([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, appliedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const intro = category?.description ? stripHtml(category.description) : '';

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
          ListHeaderComponent={
            category ? (
              <View style={{ paddingHorizontal: 6, paddingBottom: 12 }}>
                <Text
                  style={{
                    color: colors.accentSoft,
                    fontSize: 10,
                    letterSpacing: 1.8,
                    textTransform: 'uppercase',
                  }}
                >
                  Taze kavrulmuş kahve
                </Text>
                <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 6 }}>
                  {category.name}
                </Text>
                {intro ? (
                  <Text style={[muted, { marginTop: 10, lineHeight: 20 }]}>{intro}</Text>
                ) : null}
                {relatedBlog.length ? (
                  <View style={{ marginTop: 14 }}>
                    {relatedBlog.map((post) => (
                      <Pressable
                        key={post.id}
                        onPress={() => navigation.navigate('BlogPost', { slug: post.slug })}
                        style={{ paddingVertical: 6 }}
                      >
                        <Text style={{ color: colors.accentSoft, fontSize: 12 }}>
                          {post.title} →
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null
          }
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
