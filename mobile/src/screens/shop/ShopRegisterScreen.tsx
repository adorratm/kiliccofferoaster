import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { setShopToken } from '../../lib/api';
import { shopRegister } from '../../lib/shop-api';
import { useShopCart } from '../../lib/shop-cart';
import { btn, btnText, colors, input, title } from '../../ui';

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
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
      <Text style={title}>Hesap oluştur</Text>
      <TextInput placeholder="Ad" placeholderTextColor="#a58b84" value={firstName} onChangeText={setFirstName} style={input} />
      <TextInput
        placeholder="E-posta"
        placeholderTextColor="#a58b84"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={input}
      />
      <TextInput
        placeholder="Şifre"
        placeholderTextColor="#a58b84"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={input}
      />
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
        <Text style={btnText}>{busy ? 'Kaydediliyor…' : 'Kayıt ol'}</Text>
      </Pressable>
    </View>
  );
}
