import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { shopForgotPassword } from '../../lib/shop-api';
import { btn, btnText, colors, link, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await shopForgotPassword(email);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: 'center' }}>
      <PageHeader
        kicker="Hesap"
        heading="Şifre sıfırla"
        subtitle="Kayıtlı e-postanıza 1 saat geçerli bir bağlantı gönderilir."
      />
      {done ? (
        <Text style={[muted, { marginTop: 4, lineHeight: 22 }]}>
          E-posta kayıtlıysa sıfırlama bağlantısı gönderildi. Sitedeki veya uygulamadaki bağlantıyı kullanabilirsiniz.
        </Text>
      ) : (
        <>
          <Field
            title="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@posta.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
          <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
            <Text style={btnText}>{busy ? 'Gönderiliyor…' : 'Bağlantı gönder'}</Text>
          </Pressable>
        </>
      )}
      <Pressable onPress={() => navigation.navigate('ShopLogin')} style={{ marginTop: 20 }}>
        <Text style={link}>Girişe dön</Text>
      </Pressable>
    </View>
  );
}
