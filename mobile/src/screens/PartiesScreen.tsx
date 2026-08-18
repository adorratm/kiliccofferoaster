import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';

type Party = { id: string; title: string; type: string; taxNumber?: string | null };

export function PartiesScreen() {
  const [items, setItems] = useState<Party[]>([]);
  const [title, setTitle] = useState('');
  const [taxNumber, setTaxNumber] = useState('');

  async function load() {
    try {
      const data = await api<{ items: Party[] }>('/accounting/parties?limit=50');
      setItems(data.items);
    } catch {
      /* çevrimdışı */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const payload = { type: 'customer', title, taxNumber };
    try {
      await api('/accounting/parties', { method: 'POST', body: payload });
    } catch {
      await enqueue({
        id: crypto.randomUUID(),
        collection: 'parties',
        action: 'upsert',
        payload,
      });
    }
    setTitle('');
    setTaxNumber('');
    await load();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#131313', padding: 16 }}>
      <TextInput
        placeholder="Unvan"
        placeholderTextColor="#a58b84"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: '#57423d', color: '#e5e2e1', padding: 10 }}
      />
      <TextInput
        placeholder="VKN / TCKN"
        placeholderTextColor="#a58b84"
        value={taxNumber}
        onChangeText={setTaxNumber}
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: '#57423d',
          color: '#e5e2e1',
          padding: 10,
        }}
      />
      <Pressable onPress={() => void save()} style={{ marginTop: 12, backgroundColor: '#cc5b3e', padding: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Kaydet</Text>
      </Pressable>
      {items.map((p) => (
        <View key={p.id} style={{ marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#3a3939', paddingBottom: 8 }}>
          <Text style={{ color: '#e5e2e1' }}>{p.title}</Text>
          <Text style={{ color: '#a58b84' }}>{p.type} · {p.taxNumber || '—'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
