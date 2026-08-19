import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import {
  shopAddresses,
  shopCreateAddress,
  shopDeleteAddress,
} from '../../lib/shop-api';
import type { Address } from '../../lib/shop-types';
import { btn, btnText, colors, muted } from '../../ui';

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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader kicker="Hesap" heading="Adresler" subtitle="Teslimat için kayıtlı adresler." />
      {items.map((a) => (
        <View
          key={a.id}
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surface,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.accentSoft, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' }}>
            {a.title}
          </Text>
          <Text style={{ color: colors.text, fontWeight: '700', marginTop: 6 }}>{a.fullName}</Text>
          <Text style={[muted, { marginTop: 6, lineHeight: 20 }]}>
            {a.addressLine}{'\n'}{a.district} / {a.city}
            {a.postalCode ? ` · ${a.postalCode}` : ''}
          </Text>
          <Pressable
            onPress={async () => {
              await shopDeleteAddress(a.id);
              load();
            }}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: colors.danger, fontSize: 12 }}>Sil</Text>
          </Pressable>
        </View>
      ))}
      <SectionLabel label="Yeni adres" />
      <Field title="Başlık" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
      <Field title="Ad soyad" value={form.fullName} onChangeText={(fullName) => setForm({ ...form, fullName })} />
      <Field title="Telefon" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} keyboardType="phone-pad" />
      <Field title="İl" value={form.city} onChangeText={(city) => setForm({ ...form, city })} />
      <Field title="İlçe" value={form.district} onChangeText={(district) => setForm({ ...form, district })} />
      <Field title="Adres" value={form.addressLine} onChangeText={(addressLine) => setForm({ ...form, addressLine })} multiline />
      <Field title="Posta kodu" value={form.postalCode} onChangeText={(postalCode) => setForm({ ...form, postalCode })} keyboardType="number-pad" />
      {msg ? <Text style={{ color: colors.danger, marginTop: 8 }}>{msg}</Text> : null}
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>Kaydet</Text>
      </Pressable>
    </ScrollView>
  );
}
