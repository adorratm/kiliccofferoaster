import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type Sale = {
  id: string;
  externalKey: string;
  saleDate: string;
  zNo?: string | null;
  receiptNo?: string | null;
  total: string;
  cashAmount: string;
  cardAmount: string;
};

const SAMPLE =
  'externalKey,saleDate,zNo,receiptNo,total,taxAmount,cashAmount,cardAmount\nZ12-1,2026-08-18,12,1,250,41.67,250,0';

export function OkcScreen() {
  const [items, setItems] = useState<Sale[]>([]);
  const [csv, setCsv] = useState(SAMPLE);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api<unknown>('/accounting/okc?limit=100');
      setItems(asArray<Sale>(data));
      setError('');
    } catch {
      setError('ÖKC satışları yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function importCsv() {
    setMsg('');
    setError('');
    const lines = csv.trim().split(/\r?\n/).slice(1);
    const rows = lines
      .map((line) => line.split(',').map((c) => c.trim()))
      .filter((cols) => cols.length >= 5)
      .map((cols) => ({
        externalKey: cols[0],
        saleDate: cols[1],
        zNo: cols[2] || undefined,
        receiptNo: cols[3] || undefined,
        total: Number(cols[4] || 0),
        taxAmount: Number(cols[5] || 0),
        cashAmount: Number(cols[6] || 0),
        cardAmount: Number(cols[7] || 0),
      }));
    try {
      const result = await api<{ imported: number; skipped: number }>(
        '/accounting/okc/import',
        { method: 'POST', body: { rows } },
      );
      setMsg(`${result.imported} içe alındı, ${result.skipped} atlandı.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İçe aktarma başarısız');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>ÖKC import</Text>
      <Text style={[muted, { marginTop: 6, lineHeight: 18 }]}>
        Beko X30TR CSV / Z özeti. Nakit ve kart kasa hareketi oluşur; aynı satış için
        e-arşiv kesilmez.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      <TextInput
        value={csv}
        onChangeText={setCsv}
        multiline
        textAlignVertical="top"
        style={[input, { minHeight: 140, fontFamily: 'monospace', fontSize: 12 }]}
      />
      <Pressable onPress={() => void importCsv()} style={btn}>
        <Text style={btnText}>İçe aktar</Text>
      </Pressable>

      <Text style={[muted, { marginTop: 24 }]}>SON SATIŞLAR</Text>
      {items.map((s) => (
        <View key={s.id} style={card}>
          <Text style={{ color: colors.text }}>{s.saleDate}</Text>
          <Text style={muted}>
            {s.receiptNo || s.externalKey} / Z {s.zNo || '—'}
          </Text>
          <Text style={{ color: colors.accentSoft, marginTop: 6 }}>
            {s.total} ₺ · nakit {s.cashAmount} · kart {s.cardAmount}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
