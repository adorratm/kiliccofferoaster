import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { ShopStackParamList } from '../../navigation/types';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { shopBlogPost, shopCategories, shopProduct } from '../../lib/shop-api';
import type { BlogPost, Category, Product } from '../../lib/shop-types';
import { HtmlContent } from '../../components/HtmlContent';
import { colors, muted, title } from '../../ui';
import { ProductCard } from './ProductCard';

type Props = NativeStackScreenProps<ShopStackParamList, 'BlogPost'>;

function formatDate(value?: string | null) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export function BlogPostScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedCategories, setRelatedCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await shopBlogPost(slug);
      setPost(data);
      navigation.setOptions({ title: data.title });
      const productSlugs = (data.relatedProductSlugs || []).slice(0, 4);
      const catSlugs = data.relatedCategorySlugs || [];
      const [products, cats] = await Promise.all([
        Promise.all(
          productSlugs.map((s) => shopProduct(s).catch(() => null)),
        ),
        catSlugs.length ? shopCategories().catch(() => []) : Promise.resolve([]),
      ]);
      setRelatedProducts(products.filter((p): p is Product => Boolean(p)));
      setRelatedCategories(cats.filter((c) => catSlugs.includes(c.slug)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yazı yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [navigation, slug]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) return <ScreenLoader />;

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
        <Text style={{ color: colors.danger }}>{error || 'Yazı bulunamadı'}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.accent} />
      }
    >
      {post.coverImageUrl ? (
        <Image
          source={{ uri: post.coverImageUrl }}
          style={{ height: 220, backgroundColor: colors.surfaceHigh }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.accentSoft, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
          {[formatDate(post.publishedAt), post.authorName].filter(Boolean).join(' · ') || 'Blog'}
        </Text>
        <Text style={[title, { marginTop: 10 }]}>{post.title}</Text>
        {post.excerpt ? (
          <Text style={[muted, { marginTop: 12, fontSize: 15, lineHeight: 24 }]}>{post.excerpt}</Text>
        ) : null}
        <View style={{ height: 1, backgroundColor: colors.borderMuted, marginVertical: 20 }} />
        <HtmlContent html={post.content} />
        {relatedCategories.length ? (
          <View style={{ marginTop: 24 }}>
            <SectionLabel label="Kategoriler" />
            {relatedCategories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => navigation.navigate('Catalog', { categorySlug: cat.slug })}
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderMuted,
                  padding: 12,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: colors.accentSoft }}>{cat.name} →</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {relatedProducts.length ? (
          <View style={{ marginTop: 24 }}>
            <SectionLabel label="İlgili kavrumlar" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
              {relatedProducts.map((item) => (
                <View key={item.id} style={{ width: '50%' }}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.navigate('Product', { slug: item.slug })}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
