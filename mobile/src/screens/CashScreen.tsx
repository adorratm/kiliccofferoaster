import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CASH_EXPENSE_CATEGORIES, CASH_EXPENSE_CATEGORY_LABELS } from '@kilic/accounting-contracts';
import { api } from '../lib/api';
import { enqueue } from '../lib/sync';
import { colors } from '../ui';

type Account = { id: string; name: string; balance?: string };

export function CashScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [category, setCategory] = useState('');

  async function load() {
    try {
      setAccounts(await api<Account[]>('/accounting/cash/accounts'));
    } catch {
      /* çevrimdışı */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const accountId = accounts[0]?.id;
    if (!accountId) return;
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
    await load();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#131313', padding: 16 }}>
      {accounts.map((a) => (
        <View key={a.id} style={{ marginBottom: 8, borderWidth: 1, borderColor: '#57423d', padding: 12 }}>
          <Text style={{ color: '#a58b84' }}>{a.name}</Text>
          <Text style={{ color: '#cc5b3e', fontSize: 20 }}>{a.balance} ₺</Text>
        </View>
      ))}
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
      <Pressable onPress={() => void save()} style={{ marginTop: 12, backgroundColor: '#cc5b3e', padding: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          {type === 'in' ? 'Kasa girişi' : 'Kasa çıkışı'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
