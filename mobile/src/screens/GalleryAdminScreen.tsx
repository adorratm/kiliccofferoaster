import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { btn, btnText, card, colors, muted, screen, title } from '../ui';

type Item = {
  id: string;
  source: string;
  caption: string | null;
  isVisible: boolean;
  mediaUrl: string;
};

export function GalleryAdminScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setItems(asArray<Item>(await api('/gallery/admin/items')));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Galeri yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function syncInstagram() {
    setBusy(true);
    setMsg('');
    try {
      const result = await api<{ synced: number; total: number }>(
        '/gallery/admin/sync-instagram',
        { method: 'POST' },
      );
      setMsg(`Instagram: ${result.synced}/${result.total} senkron`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Senkron başarısız');
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisible(item: Item) {
    try {
      await api(`/gallery/admin/items/${item.id}`, {
        method: 'PATCH',
        body: { isVisible: !item.isVisible },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  }

  async function remove(id: string) {
    try {
      await api(`/gallery/admin/items/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Site galerisi</Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}
      <Pressable
        disabled={busy}
        onPress={() => void syncInstagram()}
        style={[btn, { opacity: busy ? 0.5 : 1 }]}
      >
        <Text style={btnText}>Instagram senkron</Text>
      </Pressable>
      {items.map((item) => (
        <View key={item.id} style={card}>
          <Text style={{ color: colors.accentSoft }}>{item.source}</Text>
          <Text style={{ color: colors.text, marginTop: 4 }} numberOfLines={2}>
            {item.caption || item.mediaUrl}
          </Text>
          <Text style={muted}>{item.isVisible ? 'Görünür' : 'Gizli'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable
              onPress={() => void toggleVisible(item)}
              style={[btn, { flex: 1, marginTop: 0 }]}
            >
              <Text style={btnText}>{item.isVisible ? 'Gizle' : 'Göster'}</Text>
            </Pressable>
            <Pressable
              onPress={() => void remove(item.id)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.danger,
                paddingVertical: 16,
              }}
            >
              <Text style={{ color: colors.danger, textAlign: 'center' }}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
