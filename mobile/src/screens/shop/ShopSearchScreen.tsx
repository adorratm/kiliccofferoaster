import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/types';
import { shopSearch } from '../../lib/shop-api';
import { colors, muted } from '../../ui';

type Props = NativeStackScreenProps<ShopStackParamList, 'ShopSearch'>;

export function ShopSearchScreen({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ title: string; subtitle?: string; href: string }[]>([]);

  async function run() {
    if (q.trim().length < 2) return;
    try {
      const res = await shopSearch(q.trim());
      const items = res.groups.flatMap((g) => g.items);
      setHits(items);
    } catch {
      setHits([]);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <TextInput
        placeholder="Kahve, kategori…"
        placeholderTextColor={colors.muted}
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => void run()}
        autoFocus
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.text,
          padding: 12,
        }}
      />
      <Pressable onPress={() => void run()} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.accentSoft }}>Ara</Text>
      </Pressable>
      <ScrollView style={{ marginTop: 16 }}>
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
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text }}>{h.title}</Text>
            {h.subtitle ? <Text style={muted}>{h.subtitle}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
