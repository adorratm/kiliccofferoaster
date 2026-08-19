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
import { Feather } from '@expo/vector-icons';
import type { ShopStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { shopBlog } from '../../lib/shop-api';
import type { BlogPost } from '../../lib/shop-types';
import { colors, muted } from '../../ui';

type Props = NativeStackScreenProps<ShopStackParamList, 'BlogList'>;

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

export function BlogListScreen({ navigation }: Props) {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const page = await shopBlog({ limit: 20 });
      setItems(page.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Blog yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) return <ScreenLoader />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.accent} />
      }
    >
      <PageHeader kicker="Notlar" heading="Blog" subtitle="Kavrum profilleri ve demleme notları." />
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {!items.length && !error ? (
        <EmptyState icon="book-open" title="Henüz yazı yok" body="Yeni notlar burada görünecek." />
      ) : null}
      {items.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => navigation.navigate('BlogPost', { slug: post.slug })}
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surface,
            overflow: 'hidden',
          }}
        >
          {post.coverImageUrl ? (
            <Image
              source={{ uri: post.coverImageUrl }}
              style={{ height: 140, backgroundColor: colors.surfaceHigh }}
              resizeMode="cover"
            />
          ) : null}
          <View style={{ padding: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', lineHeight: 24 }}>
              {post.title}
            </Text>
            {post.excerpt ? (
              <Text style={[muted, { marginTop: 8, lineHeight: 20 }]} numberOfLines={3}>
                {post.excerpt}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
              <Text style={[muted, { fontSize: 11, letterSpacing: 0.6 }]}>
                {[formatDate(post.publishedAt), post.authorName].filter(Boolean).join(' · ')}
              </Text>
              <Feather name="arrow-right" size={16} color={colors.accentSoft} />
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
