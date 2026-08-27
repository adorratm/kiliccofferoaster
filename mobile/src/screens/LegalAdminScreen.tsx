import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { btn, btnText, card, colors, muted, screen, title } from '../ui';

type Doc = {
  id: string;
  slug: string;
  title: string;
  isPublished?: boolean;
  version?: number;
};

export function LegalAdminScreen() {
  const [rows, setRows] = useState<Doc[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api<unknown>('/legal/admin/documents').catch(() =>
        api<unknown>('/legal/documents'),
      );
      setRows(asArray<Doc>(data));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belgeler yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function publish(id: string) {
    setBusy(id);
    setMsg('');
    try {
      await api(`/legal/documents/${id}/publish`, { method: 'POST' }).catch(() =>
        api(`/legal/admin/documents/${id}`, {
          method: 'PATCH',
          body: { isPublished: true },
        }),
      );
      setMsg('Yayınlandı');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yayınlama başarısız');
    } finally {
      setBusy(null);
    }
  }

  async function syncDefaults() {
    setBusy('sync');
    setMsg('');
    try {
      await api('/legal/documents/sync-defaults', { method: 'POST' }).catch(() =>
        api('/legal/admin/documents/sync-defaults', { method: 'POST' }),
      );
      setMsg('Varsayılan belgeler senkronlandı');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Senkron başarısız');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Sözleşmeler</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        Yasal belge listesi. Uzun metin düzenleme web admin’de yapılır.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}
      <Pressable
        disabled={busy === 'sync'}
        onPress={() => void syncDefaults()}
        style={[btn, { opacity: busy === 'sync' ? 0.5 : 1 }]}
      >
        <Text style={btnText}>Varsayılanları senkronla</Text>
      </Pressable>
      {rows.map((d) => (
        <View key={d.id} style={card}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{d.title}</Text>
          <Text style={muted}>
            {d.slug}
            {d.version != null ? ` · v${d.version}` : ''}
            {d.isPublished ? ' · yayında' : ' · taslak'}
          </Text>
          {!d.isPublished ? (
            <Pressable
              disabled={busy === d.id}
              onPress={() => void publish(d.id)}
              style={[btn, { marginTop: 10, opacity: busy === d.id ? 0.5 : 1 }]}
            >
              <Text style={btnText}>Yayınla</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
