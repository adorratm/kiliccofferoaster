import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { shopResetPassword } from '../../lib/shop-api';
import { btn, btnText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const token = route.params?.token || '';
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!token) {
      setError('Geçersiz sıfırlama bağlantısı.');
      return;
    }
    if (password !== password2) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setBusy(true);
    try {
      await shopResetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şifre güncellenemedi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: 'center' }}>
      <PageHeader kicker="Hesap" heading="Yeni şifre" subtitle="Bağlantıdaki token ile şifrenizi yenileyin." />
      {done ? (
        <>
          <Text style={[muted, { marginTop: 4 }]}>Şifreniz kaydedildi. Giriş yapabilirsiniz.</Text>
          <Pressable onPress={() => navigation.navigate('ShopLogin')} style={btn}>
            <Text style={btnText}>Giriş yap</Text>
          </Pressable>
        </>
      ) : (
        <>
          {!token ? (
            <Text style={{ color: colors.danger, marginTop: 4 }}>
              Bağlantıda token yok. E-postadaki linki kullanın.
            </Text>
          ) : null}
          <Field
            title="Yeni şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Field
            title="Yeni şifre (tekrar)"
            value={password2}
            onChangeText={setPassword2}
            secureTextEntry
            autoCapitalize="none"
          />
          {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
          <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
            <Text style={btnText}>{busy ? 'Kaydediliyor…' : 'Şifreyi kaydet'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
