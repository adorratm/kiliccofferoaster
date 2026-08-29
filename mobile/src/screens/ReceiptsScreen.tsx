import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type InvoiceLine = {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  direction?: string;
  edocumentType?: string;
  lines?: InvoiceLine[];
};

export function ReceiptsScreen() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const data = await api<{ items: Invoice[] }>(
        '/accounting/invoices?limit=50&receiptOnly=true',
      );
      setItems(data.items.filter((i) => i.status !== 'cancelled'));
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
    setDescription('');
    setPrice('');
    setQty('1');
  }

  function startEdit(inv: Invoice) {
    const line = inv.lines?.[0];
    setEditingId(inv.id);
    setDescription(line?.description || '');
    setPrice(line?.unitPrice || '');
    setQty(line?.quantity || '1');
    setError('');
    setMsg('');
  }

  async function save() {
    setError('');
    setMsg('');
    const lines = [
      {
        description,
        quantity: Number(qty) || 1,
        unitPrice: Number(price),
        vatRate: 20,
      },
    ];
    try {
      if (editingId) {
        await api(`/accounting/invoices/${editingId}`, {
          method: 'PATCH',
          body: { lines },
        });
        setMsg('Fiş güncellendi');
      } else {
        const payload = {
          direction: 'sales',
          edocumentType: 'none',
          issueDate: new Date().toISOString().slice(0, 10),
          lines,
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
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt hatası');
    }
  }

  async function toInvoice(id: string) {
    try {
      await api(`/accounting/invoices/${id}/to-invoice`, { method: 'POST', body: {} });
      setMsg('Faturaya çevrildi — Faturalar ekranında görünür');
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dönüşüm hatası');
    }
  }

  function confirmCancel(id: string) {
    Alert.alert('Fiş iptal', 'Bu fişi iptal etmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal et',
        style: 'destructive',
        onPress: () => void cancelReceipt(id),
      },
    ]);
  }

  async function cancelReceipt(id: string) {
    try {
      await api(`/accounting/invoices/${id}/cancel`, { method: 'POST' });
      setMsg('Fiş iptal edildi');
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İptal hatası');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Fişler</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        Taslak fişleri düzenleyin veya iptal edin; faturaya çevirebilirsiniz.
      </Text>
      <TextInput
        placeholder="Açıklama"
        placeholderTextColor="#a58b84"
        value={description}
        onChangeText={setDescription}
        style={[input, { marginTop: 12 }]}
      />
      <TextInput
        placeholder="Miktar"
        placeholderTextColor="#a58b84"
        keyboardType="decimal-pad"
        value={qty}
        onChangeText={setQty}
        style={[input, { marginTop: 8 }]}
      />
      <TextInput
        placeholder="Tutar (KDV dahil birim)"
        placeholderTextColor="#a58b84"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
        style={[input, { marginTop: 8 }]}
      />
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>{editingId ? 'Güncelle' : 'Fiş kaydet'}</Text>
      </Pressable>
      {editingId ? (
        <Pressable onPress={resetForm} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>Vazgeç</Text>
        </Pressable>
      ) : null}
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      {items.map((i) => (
        <View key={i.id} style={card}>
          <Text style={{ color: colors.text }}>{i.invoiceNumber}</Text>
          <Text style={muted}>
            {i.status} · {i.total}
          </Text>
          {i.status === 'draft' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              <Pressable onPress={() => startEdit(i)}>
                <Text style={{ color: colors.accentSoft }}>Düzenle</Text>
              </Pressable>
              <Pressable onPress={() => void toInvoice(i.id)}>
                <Text style={{ color: colors.accentSoft }}>Faturaya</Text>
              </Pressable>
              <Pressable onPress={() => confirmCancel(i.id)}>
                <Text style={{ color: colors.danger }}>İptal</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
