import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import type { ShopStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { SearchBar } from '../../components/shop/SearchBar';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { shopSearch } from '../../lib/shop-api';
import { colors, muted } from '../../ui';

type Props = NativeStackScreenProps<ShopStackParamList, 'ShopSearch'>;

type SearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type?: string;
};

type SearchGroup = {
  type: string;
  label: string;
  items: SearchHit[];
};

function pathOf(href: string) {
  return href.split('?')[0].replace(/\/$/, '') || '/';
}

function navigateSearchHit(
  navigation: Props['navigation'],
  hit: SearchHit,
  groupType: string,
) {
  const path = pathOf(hit.href);
  const kind = (hit.type || groupType || '').toLowerCase();

  if (kind === 'product' || path.startsWith('/urunler/')) {
    const parts = path.split('/').filter(Boolean);
    // /urunler/:slug  |  /urunler/kategori/:slug
    if (parts[0] === 'urunler' && parts[1] === 'kategori' && parts[2]) {
      navigation.navigate('Catalog', { categorySlug: parts[2] });
      return;
    }
    if (parts[0] === 'urunler' && parts[1] && parts[1] !== 'kategori') {
      navigation.navigate('Product', { slug: decodeURIComponent(parts[1]) });
      return;
    }
  }

  if (kind === 'blog' || path.startsWith('/blog')) {
    if (path === '/blog') {
      navigation.navigate('BlogList');
      return;
    }
    const slug = path.split('/')[2];
    if (slug) {
      navigation.navigate('BlogPost', { slug: decodeURIComponent(slug) });
      return;
    }
  }

  if (kind === 'legal') {
    const slug = path.replace(/^\//, '').split('/')[0];
    if (slug) {
      navigation.navigate('Legal', { slug: decodeURIComponent(slug) });
      return;
    }
  }

  if (path.startsWith('/urunler/kategori/')) {
    const cat = path.split('/urunler/kategori/')[1];
    if (cat) navigation.navigate('Catalog', { categorySlug: decodeURIComponent(cat) });
    return;
  }

  if (path === '/urunler' || path.startsWith('/urunler?')) {
    navigation.navigate('Catalog', {});
    return;
  }

  if (path === '/hakkimizda') {
    navigation.navigate('About');
    return;
  }
  if (path === '/sss') {
    navigation.navigate('Faq');
    return;
  }
  if (path === '/iletisim') {
    navigation.navigate('Contact');
    return;
  }
  if (path === '/oner') {
    navigation.navigate('CoffeeFinder');
    return;
  }
  if (path === '/toptan') {
    navigation.navigate('Wholesale');
    return;
  }

  // Yasal slug (ör. /kvkk) — tek segment
  const single = path.replace(/^\//, '');
  if (single && !single.includes('/')) {
    navigation.navigate('Legal', { slug: decodeURIComponent(single) });
    return;
  }

  navigation.navigate('Catalog', { q: hit.title });
}

export function ShopSearchScreen({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [ran, setRan] = useState(false);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (q.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await shopSearch(q.trim());
      setGroups(res.groups || []);
    } catch {
      setGroups([]);
    } finally {
      setRan(true);
      setLoading(false);
    }
  }

  const hasHits = groups.some((g) => g.items.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <SearchBar
        value={q}
        placeholder="Kahve, blog, sözleşme…"
        onChangeText={setQ}
        onSubmit={() => void run()}
      />
      <Pressable onPress={() => void run()} style={{ marginTop: 12, paddingVertical: 8 }}>
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
          Ara
        </Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView style={{ marginTop: 8 }} keyboardShouldPersistTaps="handled">
          {ran && !hasHits ? (
            <EmptyState
              icon="search"
              title="Sonuç yok"
              body="En az iki karakter deneyin veya katalogda arayın."
            />
          ) : null}

          {ran && !hasHits && q.trim().length >= 2 ? (
            <Pressable
              onPress={() => navigation.navigate('Catalog', { q: q.trim() })}
              style={{ marginTop: 8, paddingVertical: 12 }}
            >
              <Text style={{ color: colors.accentSoft, textAlign: 'center', fontWeight: '600' }}>
                Katalogda “{q.trim()}” ara
              </Text>
            </Pressable>
          ) : null}

          {groups.map((group, gi) => (
            <View key={group.type} style={{ marginBottom: 8 }}>
              <SectionLabel
                index={String(gi + 1).padStart(2, '0')}
                label={group.label}
              />
              {group.items.map((h) => (
                <Pressable
                  key={`${group.type}-${h.id}`}
                  onPress={() => navigateSearchHit(navigation, h, group.type)}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderMuted,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{h.title}</Text>
                    {h.subtitle ? (
                      <Text style={[muted, { marginTop: 4 }]} numberOfLines={2}>
                        {h.subtitle}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        muted,
                        {
                          marginTop: 4,
                          fontSize: 10,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                        },
                      ]}
                    >
                      {group.label}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
