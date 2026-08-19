import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import type { ShopStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { SearchBar } from '../../components/shop/SearchBar';
import { shopSearch } from '../../lib/shop-api';
import { colors, muted } from '../../ui';

type Props = NativeStackScreenProps<ShopStackParamList, 'ShopSearch'>;

export function ShopSearchScreen({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ title: string; subtitle?: string; href: string }[]>([]);
  const [ran, setRan] = useState(false);

  async function run() {
    if (q.trim().length < 2) return;
    try {
      const res = await shopSearch(q.trim());
      const items = res.groups.flatMap((g) => g.items);
      setHits(items);
    } catch {
      setHits([]);
    } finally {
      setRan(true);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <SearchBar
        value={q}
        placeholder="Kahve, kategori, köken…"
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
      <ScrollView style={{ marginTop: 8 }}>
        {ran && !hits.length ? (
          <EmptyState icon="search" title="Sonuç yok" body="En az iki karakter ve farklı bir ifade deneyin." />
        ) : null}
        {hits.map((h) => (
          <Pressable
            key={`${h.href}-${h.title}`}
            onPress={() => {
              const slug = h.href.split('/urunler/')[1]?.split('/')[0];
              if (slug && !slug.startsWith('kategori')) {
                navigation.navigate('Product', { slug });
              } else if (h.href.includes('/kategori/')) {
                const cat = h.href.split('/kategori/')[1];
                if (cat) navigation.navigate('Catalog', { categorySlug: cat });
              } else {
                navigation.navigate('Catalog', { q: h.title });
              }
            }}
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
              {h.subtitle ? <Text style={[muted, { marginTop: 4 }]}>{h.subtitle}</Text> : null}
            </View>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
