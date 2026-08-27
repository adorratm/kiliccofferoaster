import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CASH_EXPENSE_CATEGORIES, CASH_EXPENSE_CATEGORY_LABELS } from '@kilic/accounting-contracts';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';
import { colors } from '../ui';

type Account = {
  id: string;
  name: string;
  kind?: string;
  balance?: string;
};

const KIND_LABELS: Record<string, string> = {
  cash: 'Nakit',
  bank: 'Banka',
  paytr: 'PayTR',
  pos: 'POS',
};

function kindLabel(kind?: string) {
  if (!kind) return '';
  return KIND_LABELS[kind] || kind;
}

export function CashScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [category, setCategory] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const next = await api<Account[]>('/accounting/cash/accounts');
      setAccounts(next);
      setAccountId((prev) => {
        if (prev && next.some((a) => a.id === prev)) return prev;
        const cash = next.find((a) => a.kind === 'cash');
        return cash?.id || next[0]?.id || '';
      });
    } catch {
      /* çevrimdışı */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!accountId || !amount) return;
    const payload = {
      accountId,
      type,
      amount: Number(amount),
      entryDate: new Date().toISOString().slice(0, 10),
      description,
      category: type === 'out' ? category || 'diger' : undefined,
    };
    try {
      await api('/accounting/cash/entries', { method: 'POST', body: payload });
    } catch {
      await enqueue({
        id: crypto.randomUUID(),
        collection: 'cash_entries',
        action: 'upsert',
        payload,
      });
    }
    setAmount('');
    setDescription('');
    setMsg(type === 'in' ? 'Giriş kaydedildi' : 'Çıkış kaydedildi');
    await load();
  }

  async function syncPaytr() {
    setMsg('');
    try {
      const res = await api<{ imported: number }>('/accounting/cash/sync-paytr', {
        method: 'POST',
      });
      setMsg(`PayTR eşleme: ${res.imported} kayıt`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'PayTR eşleme başarısız');
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#131313', padding: 16 }}>
      <Pressable
        onPress={() => void syncPaytr()}
        style={{
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#57423d',
          padding: 12,
        }}
      >
        <Text style={{ color: colors.accentSoft, textAlign: 'center' }}>PayTR eşle</Text>
      </Pressable>
      {msg ? (
        <Text style={{ color: '#6b9f7a', marginBottom: 8, fontSize: 12 }}>{msg}</Text>
      ) : null}
      <Text style={{ color: colors.accentSoft, marginBottom: 8, fontSize: 12, letterSpacing: 1 }}>
        HESAPLAR
      </Text>
      {accounts.map((a) => {
        const selected = a.id === accountId;
        return (
          <Pressable
            key={a.id}
            onPress={() => setAccountId(a.id)}
            style={{
              marginBottom: 8,
              borderWidth: 1,
              borderColor: selected ? colors.accent : '#57423d',
              padding: 12,
              backgroundColor: selected ? '#1c1614' : 'transparent',
            }}
          >
            <Text style={{ color: '#a58b84', fontSize: 11, textTransform: 'uppercase' }}>
              {kindLabel(a.kind)}
            </Text>
            <Text style={{ color: '#e5e2e1', marginTop: 2 }}>{a.name}</Text>
            <Text style={{ color: '#cc5b3e', fontSize: 20, marginTop: 4 }}>{a.balance} ₺</Text>
          </Pressable>
        );
      })}

      <Text style={{ color: colors.accentSoft, marginTop: 12, marginBottom: 8, fontSize: 12, letterSpacing: 1 }}>
        HAREKET TÜRÜ
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {(['in', 'out'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: type === t ? colors.accent : '#57423d',
              padding: 10,
            }}
          >
            <Text style={{ color: type === t ? colors.accentSoft : '#e5e2e1', textAlign: 'center' }}>
              {t === 'in' ? 'Giriş' : 'Çıkış'}
            </Text>
          </Pressable>
        ))}
      </View>
      {type === 'out' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {CASH_EXPENSE_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={{
                borderWidth: 1,
                borderColor: category === c ? colors.accent : '#57423d',
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: category === c ? colors.accentSoft : '#e5e2e1', fontSize: 12 }}>
                {CASH_EXPENSE_CATEGORY_LABELS[c]}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <TextInput
        placeholder="Tutar"
        placeholderTextColor="#a58b84"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        style={{ borderWidth: 1, borderColor: '#57423d', color: '#e5e2e1', padding: 10 }}
      />
      <TextInput
        placeholder="Açıklama"
        placeholderTextColor="#a58b84"
        value={description}
        onChangeText={setDescription}
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: '#57423d',
          color: '#e5e2e1',
          padding: 10,
        }}
      />
      <Pressable
        onPress={() => void save()}
        disabled={!accountId || !amount}
        style={{
          marginTop: 12,
          backgroundColor: '#cc5b3e',
          padding: 12,
          opacity: !accountId || !amount ? 0.5 : 1,
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          {type === 'in' ? 'Giriş kaydet' : 'Çıkış kaydet'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
