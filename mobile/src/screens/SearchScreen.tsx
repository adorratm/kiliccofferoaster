import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { RootStack } from '../../App';
import { api } from '../lib/api';
import { card, colors, input, muted, screen } from '../ui';

type Hit = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  screen?: string;
};

type Props = NativeStackScreenProps<RootStack, 'Search'>;

export function SearchScreen({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<{ type: string; label: string; items: Hit[] }[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      void api<{ groups: { type: string; label: string; items: Hit[] }[] }>(
        `/ops/search?q=${encodeURIComponent(q.trim())}&limit=8`,
      )
        .then((data) => setGroups(data.groups || []))
        .catch(() => setGroups([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <ScrollView style={screen} keyboardShouldPersistTaps="handled">
      <TextInput
        autoFocus
        value={q}
        onChangeText={setQ}
        placeholder="Ürün, sipariş, müşteri, cari…"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={[input, { marginTop: 0 }]}
      />
      {q.trim().length < 2 ? (
        <Text style={[muted, { marginTop: 16 }]}>En az 2 karakter yazın.</Text>
      ) : loading ? (
        <Text style={[muted, { marginTop: 16 }]}>Aranıyor…</Text>
      ) : !groups.length ? (
        <Text style={[muted, { marginTop: 16 }]}>Sonuç yok</Text>
      ) : (
        groups.map((g) => (
          <View key={g.type}>
            <Text style={[muted, { marginTop: 18, letterSpacing: 2 }]}>{g.label.toUpperCase()}</Text>
            {g.items.map((hit) => (
              <Pressable
                key={`${hit.type}-${hit.id}`}
                style={card}
                onPress={() => {
                  if (hit.screen === 'CustomerDetail') {
                    navigation.navigate('CustomerDetail', { id: hit.id });
                    return;
                  }
                  if (hit.type === 'product') {
                    navigation.navigate('ProductEdit', { id: hit.id });
                    return;
                  }
                  if (hit.screen && hit.screen !== 'CustomerDetail') {
                    navigation.navigate(hit.screen as never);
                  }
                }}
              >
                <Text style={{ color: colors.text }}>{hit.title}</Text>
                {hit.subtitle ? <Text style={muted}>{hit.subtitle}</Text> : null}
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}
