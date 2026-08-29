import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type Party = {
  id: string;
  title: string;
  type: 'customer' | 'supplier' | string;
  taxNumber?: string | null;
  taxOffice?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
};

export function PartiesScreen() {
  const [items, setItems] = useState<Party[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<'customer' | 'supplier'>('customer');
  const [title, setTitle] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const data = await api<{ items: Party[] }>('/accounting/parties?limit=50');
      setItems(data.items);
      setError('');
    } catch {
      /* çevrimdışı */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setType('customer');
    setTitle('');
    setTaxNumber('');
  }

  function startEdit(p: Party) {
    setEditingId(p.id);
    setType(p.type === 'supplier' ? 'supplier' : 'customer');
    setTitle(p.title);
    setTaxNumber(p.taxNumber || '');
    setError('');
    setMsg('');
  }

  async function save() {
    setError('');
    setMsg('');
    const payload = {
      type,
      title,
      taxNumber: taxNumber || undefined,
    };
    try {
      if (editingId) {
        await api(`/accounting/parties/${editingId}`, {
          method: 'PATCH',
          body: payload,
        });
        setMsg('Cari güncellendi');
      } else {
        try {
          await api('/accounting/parties', { method: 'POST', body: payload });
          setMsg('Cari kaydedildi');
        } catch {
          await enqueue({
            id: crypto.randomUUID(),
            collection: 'parties',
            action: 'upsert',
            payload,
          });
          setMsg('Çevrimdışı kuyruğa alındı');
        }
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt hatası');
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Cari sil', 'Bu cariyi silmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => void removeParty(id),
      },
    ]);
  }

  async function removeParty(id: string) {
    try {
      await api(`/accounting/parties/${id}`, { method: 'DELETE' });
      setMsg('Cari silindi');
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Cari</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        Müşteri / tedarikçi — oluştur, düzenle, sil.
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {(['customer', 'supplier'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: type === t ? colors.accent : colors.borderMuted,
              padding: 10,
            }}
          >
            <Text
              style={{
                color: type === t ? colors.accentSoft : colors.muted,
                textAlign: 'center',
                fontSize: 12,
              }}
            >
              {t === 'supplier' ? 'Tedarikçi' : 'Müşteri'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder="Unvan"
        placeholderTextColor="#a58b84"
        value={title}
        onChangeText={setTitle}
        style={[input, { marginTop: 8 }]}
      />
      <TextInput
        placeholder="VKN / TCKN"
        placeholderTextColor="#a58b84"
        value={taxNumber}
        onChangeText={setTaxNumber}
        style={[input, { marginTop: 8 }]}
      />
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>{editingId ? 'Güncelle' : 'Kaydet'}</Text>
      </Pressable>
      {editingId ? (
        <Pressable onPress={resetForm} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>Vazgeç</Text>
        </Pressable>
      ) : null}
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      {items.map((p) => (
        <View key={p.id} style={card}>
          <Text style={{ color: colors.text }}>{p.title}</Text>
          <Text style={muted}>
            {p.type === 'supplier' ? 'Tedarikçi' : 'Müşteri'} · {p.taxNumber || '—'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Pressable onPress={() => startEdit(p)}>
              <Text style={{ color: colors.accentSoft }}>Düzenle</Text>
            </Pressable>
            <Pressable onPress={() => confirmDelete(p.id)}>
              <Text style={{ color: colors.danger }}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
