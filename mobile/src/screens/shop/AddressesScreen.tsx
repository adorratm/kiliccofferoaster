import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import {
  shopAddresses,
  shopCreateAddress,
  shopDeleteAddress,
  shopUpdateAddress,
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
  const [asDefault, setAsDefault] = useState(true);
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
      await shopCreateAddress({
        ...form,
        isDefaultShipping: asDefault || items.length === 0,
        isDefaultBilling: asDefault || items.length === 0,
      });
      setForm({ ...form, addressLine: '' });
      setAsDefault(false);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Kayıt başarısız');
    }
  }

  async function makeDefault(id: string, kind: 'shipping' | 'billing') {
    setMsg('');
    try {
      await shopUpdateAddress(
        id,
        kind === 'shipping'
          ? { isDefaultShipping: true }
          : { isDefaultBilling: true },
      );
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Varsayılan ayarlanamadı');
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
            {a.isDefaultShipping ? ' · teslimat' : ''}
            {a.isDefaultBilling ? ' · fatura' : ''}
          </Text>
          <Text style={{ color: colors.text, fontWeight: '700', marginTop: 6 }}>{a.fullName}</Text>
          <Text style={[muted, { marginTop: 6, lineHeight: 20 }]}>
            {a.addressLine}{'\n'}{a.district} / {a.city}
            {a.postalCode ? ` · ${a.postalCode}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
            {!a.isDefaultShipping ? (
              <Pressable onPress={() => void makeDefault(a.id, 'shipping')}>
                <Text style={{ color: colors.accentSoft, fontSize: 12 }}>Varsayılan teslimat</Text>
              </Pressable>
            ) : null}
            {!a.isDefaultBilling ? (
              <Pressable onPress={() => void makeDefault(a.id, 'billing')}>
                <Text style={{ color: colors.accentSoft, fontSize: 12 }}>Varsayılan fatura</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={async () => {
                await shopDeleteAddress(a.id);
                load();
              }}
            >
              <Text style={{ color: colors.danger, fontSize: 12 }}>Sil</Text>
            </Pressable>
          </View>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ color: colors.text, flex: 1, marginRight: 12 }}>Varsayılan teslimat adresi</Text>
        <Switch value={asDefault} onValueChange={setAsDefault} trackColor={{ true: colors.accent }} />
      </View>
      {msg ? <Text style={{ color: colors.danger, marginTop: 8 }}>{msg}</Text> : null}
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>Kaydet</Text>
      </Pressable>
    </ScrollView>
  );
}
