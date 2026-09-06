import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardScreen } from '../components/KeyboardScreen';
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
  okcSaleId?: string | null;
};

function edocLabel(type?: string) {
  if (type === 'einvoice') return 'e-Fatura';
  return 'e-Arşiv';
}

export function InvoicesScreen() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const data = await api<{ items: Invoice[] }>(
        '/accounting/invoices?limit=50&receiptOnly=false',
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
      edocumentType: 'earchive',
      issueDate: new Date().toISOString().slice(0, 10),
      lines: [{ description, quantity: 1, unitPrice: Number(price), vatRate: 20 }],
    };
    try {
      await api('/accounting/invoices', { method: 'POST', body: payload });
      setMsg('Taslak fatura kaydedildi');
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

  async function toReceipt(id: string) {
    try {
      await api(`/accounting/invoices/${id}/to-receipt`, { method: 'POST' });
      setMsg('Fişe çevrildi — Fişler ekranında görünür');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dönüşüm hatası');
    }
  }

  async function sendGib(id: string) {
    try {
      await api(`/accounting/invoices/${id}/send`, { method: 'POST' });
      setMsg('GİB gönderildi');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderim hatası');
    }
  }

  return (
    <KeyboardScreen contentContainerStyle={{ padding: 16 }}>
      <Text style={title}>Faturalar</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        e-Arşiv / e-Fatura. Taslakken fişe çevrilebilir; GİB gönderimi internet gerektirir.
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
        <Text style={btnText}>Fatura kaydet</Text>
      </Pressable>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      {items.map((i) => {
        const canGib =
          !i.okcSaleId && (i.status === 'draft' || i.status === 'queued');
        return (
          <View key={i.id} style={card}>
            <Text style={{ color: colors.text }}>{i.invoiceNumber}</Text>
            <Text style={muted}>
              {edocLabel(i.edocumentType)} · {i.status} · {i.total}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              {i.status === 'draft' || i.status === 'rejected' ? (
                <Pressable onPress={() => void toReceipt(i.id)}>
                  <Text style={{ color: colors.accentSoft }}>Fişe çevir</Text>
                </Pressable>
              ) : null}
              {canGib ? (
                <Pressable onPress={() => void sendGib(i.id)}>
                  <Text style={{ color: colors.accentSoft }}>GİB</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </KeyboardScreen>
  );
}
