import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { setShopToken } from '../../lib/api';
import { shopLogin } from '../../lib/shop-api';
import { useShopCart } from '../../lib/shop-cart';
import { btn, btnText, colors, input, muted, title } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'ShopLogin'>;

export function ShopLoginScreen({ navigation }: Props) {
  const { refresh } = useShopCart();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const res = await shopLogin(email, password);
      await setShopToken(res.accessToken);
      await refresh();
      navigation.reset({ index: 0, routes: [{ name: 'Account' }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
      <Text style={title}>Müşteri girişi</Text>
      <Text style={[muted, { marginTop: 8 }]}>Personel paneli ayrı sekmededir.</Text>
      <TextInput
        placeholder="E-posta"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={input}
      />
      <TextInput
        placeholder="Şifre"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={input}
      />
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
        <Text style={btnText}>{busy ? 'Giriş…' : 'Giriş yap'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('ShopRegister')} style={{ marginTop: 16 }}>
        <Text style={{ color: colors.accentSoft, textAlign: 'center' }}>Hesap oluştur</Text>
      </Pressable>
    </View>
  );
}
