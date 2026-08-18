import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  shopAddresses,
  shopCreateAddress,
  shopDeleteAddress,
} from '../../lib/shop-api';
import type { Address } from '../../lib/shop-types';
import { btn, btnText, card, colors, input, muted, title } from '../../ui';

export function AddressesScreen() {
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState({
    title: 'Ev',
    fullName: '',
    phone: '',
    city: '',
    district: '',
    addressLine: '',
    postalCode: '',
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    void shopAddresses().then(setItems).catch(() => setItems([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    setMsg('');
    try {
      await shopCreateAddress({ ...form, isDefaultShipping: true });
      setForm({ ...form, addressLine: '' });
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Kayıt başarısız');
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={title}>Adresler</Text>
      {items.map((a) => (
        <View key={a.id} style={card}>
          <Text style={{ color: colors.text }}>{a.title} · {a.fullName}</Text>
          <Text style={muted}>
            {a.addressLine}, {a.district}/{a.city}
          </Text>
          <Pressable
            onPress={async () => {
              await shopDeleteAddress(a.id);
              load();
            }}
          >
            <Text style={{ color: colors.danger, marginTop: 8 }}>Sil</Text>
          </Pressable>
        </View>
      ))}
      <Text style={[muted, { marginTop: 20 }]}>YENİ ADRES</Text>
      {(
        [
          ['title', 'Başlık'],
          ['fullName', 'Ad soyad'],
          ['phone', 'Telefon'],
          ['city', 'İl'],
          ['district', 'İlçe'],
          ['addressLine', 'Adres'],
          ['postalCode', 'Posta kodu'],
        ] as const
      ).map(([key, label]) => (
        <TextInput
          key={key}
          placeholder={label}
          placeholderTextColor={colors.muted}
          value={form[key]}
          onChangeText={(v) => setForm({ ...form, [key]: v })}
          style={input}
        />
      ))}
      {msg ? <Text style={{ color: colors.danger, marginTop: 8 }}>{msg}</Text> : null}
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>Kaydet</Text>
      </Pressable>
    </ScrollView>
  );
}
