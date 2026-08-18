import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';

type Invoice = { id: string; invoiceNumber: string; status: string; total: string };

export function InvoicesScreen() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  async function load() {
    try {
      const data = await api<{ items: Invoice[] }>('/accounting/invoices?limit=50');
      setItems(data.items);
    } catch {
      /* çevrimdışı */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const payload = {
      direction: 'sales',
      issueDate: new Date().toISOString().slice(0, 10),
      lines: [{ description, quantity: 1, unitPrice: Number(price), vatRate: 20 }],
    };
    try {
      await api('/accounting/invoices', { method: 'POST', body: payload });
    } catch {
      await enqueue({
        id: crypto.randomUUID(),
        collection: 'invoices',
        action: 'upsert',
        payload,
      });
    }
    setDescription('');
    setPrice('');
    await load();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#131313', padding: 16 }}>
      <TextInput
        placeholder="Açıklama"
        placeholderTextColor="#a58b84"
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, borderColor: '#57423d', color: '#e5e2e1', padding: 10 }}
      />
      <TextInput
        placeholder="Tutar (KDV dahil)"
        placeholderTextColor="#a58b84"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: '#57423d',
          color: '#e5e2e1',
          padding: 10,
        }}
      />
      <Pressable onPress={() => void save()} style={{ marginTop: 12, backgroundColor: '#cc5b3e', padding: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Taslak kaydet</Text>
      </Pressable>
      <Text style={{ color: '#a58b84', marginTop: 8, fontSize: 12 }}>
        GİB gönderimi internet gerektirir; taslak kuyruğa alınır.
      </Text>
      {items.map((i) => (
        <View key={i.id} style={{ marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#3a3939', paddingBottom: 8 }}>
          <Text style={{ color: '#e5e2e1' }}>{i.invoiceNumber}</Text>
          <Text style={{ color: '#a58b84' }}>{i.status} · {i.total}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
