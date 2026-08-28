import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { marketplacePlatformLabel } from '../lib/marketplace';
import { btn, btnText, card, colors, muted, screen, title } from '../ui';

type Account = {
  id: string;
  platform: string;
  storeName: string;
  isEnabled: boolean;
};

export function MarketplaceScreen() {
  const [rows, setRows] = useState<Account[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      setRows(asArray<Account>(await api('/marketplace/accounts')));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hesaplar yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function syncOne(id: string) {
    setBusy(id);
    setMsg('');
    setError('');
    try {
      await api(`/marketplace/accounts/${id}/sync`, {
        method: 'POST',
        body: { mode: 'all' },
      });
      setMsg('Senkron tamamlandı');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Senkron başarısız');
    } finally {
      setBusy(null);
    }
  }

  async function syncAll() {
    setBusy('all');
    setMsg('');
    setError('');
    try {
      await api('/marketplace/sync-all', { method: 'POST' });
      setMsg('Tüm hesaplar senkronlandı');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toplu senkron başarısız');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Pazaryeri</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        Trendyol · Trendyol Go Market · Hepsiburada · N11 senkronu. Yeni hesap ekleme web admin
        üzerinden yapılır.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}
      <Pressable
        disabled={busy === 'all'}
        onPress={() => void syncAll()}
        style={[btn, { opacity: busy === 'all' ? 0.5 : 1 }]}
      >
        <Text style={btnText}>Tümünü senkronize et</Text>
      </Pressable>
      {rows.map((a) => (
        <View key={a.id} style={card}>
          <Text style={{ color: colors.accentSoft }}>
            {marketplacePlatformLabel(a.platform)}
          </Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>{a.storeName}</Text>
          <Text style={muted}>{a.isEnabled ? 'Aktif' : 'Pasif'}</Text>
          <Pressable
            disabled={busy === a.id}
            onPress={() => void syncOne(a.id)}
            style={[btn, { marginTop: 10, opacity: busy === a.id ? 0.5 : 1 }]}
          >
            <Text style={btnText}>Senkron</Text>
          </Pressable>
        </View>
      ))}
      {!rows.length ? (
        <Text style={[muted, { marginTop: 16 }]}>Kayıtlı pazaryeri hesabı yok.</Text>
      ) : null}
    </ScrollView>
  );
}
