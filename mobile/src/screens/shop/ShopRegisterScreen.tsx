import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { setShopToken } from '../../lib/api';
import { shopRegister } from '../../lib/shop-api';
import { useShopCart } from '../../lib/shop-cart';
import { btn, btnText, colors, link } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'ShopRegister'>;

export function ShopRegisterScreen({ navigation }: Props) {
  const { refresh } = useShopCart();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const res = await shopRegister({ email, password, firstName });
      await setShopToken(res.accessToken);
      await refresh();
      navigation.reset({ index: 0, routes: [{ name: 'Account' }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <PageHeader
          kicker="Yeni hesap"
          heading="Kayıt"
          subtitle="Sipariş takibi, adres defteri ve favoriler için hesabınızı oluşturun."
        />
        <Field title="Ad" value={firstName} onChangeText={setFirstName} placeholder="Adınız" />
        <Field
          title="E-posta"
          value={email}
          onChangeText={setEmail}
          placeholder="ornek@posta.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          title="Şifre"
          value={password}
          onChangeText={setPassword}
          placeholder="En az 8 karakter"
          secureTextEntry
          autoCapitalize="none"
        />
        {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
        <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
          <Text style={btnText}>{busy ? 'Kaydediliyor…' : 'Kayıt ol'}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ShopLogin')} style={{ marginTop: 20 }}>
          <Text style={link}>Zaten hesabım var</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
