import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  direction?: string;
  edocumentType?: string;
};

export function ReceiptsScreen() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const data = await api<{ items: Invoice[] }>(
        '/accounting/invoices?limit=50&receiptOnly=true',
      );
      setItems(data.items);
      setError('');
    } catch {
      /* çevrimdışı */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setError('');
    setMsg('');
    const payload = {
      direction: 'sales',
      edocumentType: 'none',
      issueDate: new Date().toISOString().slice(0, 10),
      lines: [{ description, quantity: 1, unitPrice: Number(price), vatRate: 20 }],
    };
    try {
      await api('/accounting/invoices', { method: 'POST', body: payload });
      setMsg('Satış fişi kaydedildi');
    } catch {
      await enqueue({
        id: crypto.randomUUID(),
        collection: 'invoices',
        action: 'upsert',
        payload,
      });
      setMsg('Çevrimdışı kuyruğa alındı');
    }
    setDescription('');
    setPrice('');
    await load();
  }

  async function toInvoice(id: string) {
    try {
      await api(`/accounting/invoices/${id}/to-invoice`, { method: 'POST', body: {} });
      setMsg('Faturaya çevrildi — Faturalar ekranında görünür');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dönüşüm hatası');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Fişler</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        İç satış fişleri. Faturaya çevirmek için satır aksiyonunu kullanın.
      </Text>
      <TextInput
        placeholder="Açıklama"
        placeholderTextColor="#a58b84"
        value={description}
        onChangeText={setDescription}
        style={[input, { marginTop: 12 }]}
      />
      <TextInput
        placeholder="Tutar (KDV dahil)"
        placeholderTextColor="#a58b84"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
        style={[input, { marginTop: 8 }]}
      />
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>Fiş kaydet</Text>
      </Pressable>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      {items.map((i) => (
        <View key={i.id} style={card}>
          <Text style={{ color: colors.text }}>{i.invoiceNumber}</Text>
          <Text style={muted}>
            {i.status} · {i.total}
          </Text>
          {i.status === 'draft' ? (
            <Pressable onPress={() => void toInvoice(i.id)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.accentSoft }}>Faturaya çevir</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
