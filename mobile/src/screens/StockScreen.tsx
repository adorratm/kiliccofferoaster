import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type Row = {
  variantId: string;
  sku: string;
  name?: string;
  label: string;
  stock: number;
  kind?: string;
};

const TYPES = [
  { value: 'in', label: 'Giriş' },
  { value: 'out', label: 'Çıkış' },
  { value: 'waste', label: 'Fire' },
  { value: 'count', label: 'Sayım' },
] as const;

export function StockScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [variantId, setVariantId] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]['value']>('in');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api<Row[]>('/accounting/stock');
      setRows(data);
      setVariantId((prev) =>
        prev && data.some((r) => r.variantId === prev)
          ? prev
          : data[0]?.variantId || '',
      );
      setError('');
    } catch {
      setError('Stok listesi alınamadı');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!variantId) return;
    const payload = {
      variantId,
      type,
      quantity:
        type === 'out' || type === 'waste'
          ? -Math.abs(Number(quantity))
          : Number(quantity),
      note: note || undefined,
    };
    setMsg('');
    setError('');
    try {
      await api('/accounting/stock/movements', { method: 'POST', body: payload });
      setMsg('Stok hareketi kaydedildi');
    } catch {
      await enqueue({
        id: crypto.randomUUID(),
        collection: 'stock_movements',
        action: 'upsert',
        payload,
      });
      setMsg('Çevrimdışı kuyruğa alındı');
    }
    setNote('');
    await load();
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Stok defteri</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        Varyant seçip giriş / çıkış / fire / sayım kaydedin.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      <Text style={[muted, { marginTop: 16 }]}>VARYANT</Text>
      {rows.map((r) => {
        const selected = r.variantId === variantId;
        return (
          <Pressable
            key={r.variantId}
            onPress={() => setVariantId(r.variantId)}
            style={[
              card,
              {
                marginTop: 8,
                borderColor: selected ? colors.accent : colors.borderMuted,
              },
            ]}
          >
            <Text style={{ color: colors.accentSoft }}>{r.sku}</Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>
              {r.name} {r.label}
            </Text>
            <Text style={muted}>
              {r.kind || '—'} · stok {r.stock}
            </Text>
          </Pressable>
        );
      })}

      <Text style={[muted, { marginTop: 16 }]}>HAREKET</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setType(t.value)}
            style={{
              borderWidth: 1,
              borderColor: type === t.value ? colors.accent : colors.borderMuted,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: type === t.value ? colors.accentSoft : colors.text }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        placeholder="Miktar"
        placeholderTextColor={colors.muted}
        style={input}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Not"
        placeholderTextColor={colors.muted}
        style={input}
      />
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>Kaydet</Text>
      </Pressable>
    </ScrollView>
  );
}
