import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { card, colors, muted, screen, title } from '../ui';

type Asset = {
  id: string;
  url: string;
  filename?: string;
  createdAt?: string;
};

export function MediaAdminScreen() {
  const [items, setItems] = useState<Asset[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const data = await api<unknown>('/cms/admin/media').catch(() =>
        api<unknown>('/media'),
      );
      setItems(asArray<Asset>(data));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Medya yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    try {
      await api(`/cms/admin/media/${id}`, { method: 'DELETE' }).catch(() =>
        api(`/media/${id}`, { method: 'DELETE' }),
      );
      setMsg('Silindi');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Medya</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        Yükleme için web admin / ürün düzenleme kullanın. Buradan liste ve silme.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}
      {items.map((m) => (
        <View key={m.id} style={card}>
          <Text style={{ color: colors.text }} numberOfLines={1}>
            {m.filename || m.url}
          </Text>
          <Text style={muted} numberOfLines={1}>
            {m.url}
          </Text>
          <Pressable onPress={() => void remove(m.id)} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.danger }}>Sil</Text>
          </Pressable>
        </View>
      ))}
      {!items.length ? (
        <Text style={[muted, { marginTop: 16 }]}>Medya kaydı yok.</Text>
      ) : null}
    </ScrollView>
  );
}
