import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { setShopToken } from '../../lib/api';
import { appleSignInAvailable, loginWithApple } from '../../lib/apple-login';
import { loginWithGoogleShop } from '../../lib/google-login';
import { shopLogin } from '../../lib/shop-api';
import { useShopCart } from '../../lib/shop-cart';
import { useStaffSession } from '../../lib/staff-session';
import { btn, btnGhost, btnGhostText, btnText, colors, link } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'ShopLogin'>;

export function ShopLoginScreen({ navigation }: Props) {
  const { refresh } = useShopCart();
  const { refreshStaff } = useStaffSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleOk, setAppleOk] = useState(false);

  useEffect(() => {
    void appleSignInAvailable().then(setAppleOk);
  }, []);

  async function finish(token: string) {
    await setShopToken(token);
    await refresh();
    await refreshStaff();
    navigation.reset({ index: 0, routes: [{ name: 'Account' }] });
  }

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const res = await shopLogin(email, password);
      await finish(res.accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız');
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError('');
    setGoogleBusy(true);
    try {
      await finish(await loginWithGoogleShop());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google girişi başarısız');
    } finally {
      setGoogleBusy(false);
    }
  }

  async function onApple() {
    setError('');
    setAppleBusy(true);
    try {
      await finish(await loginWithApple());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apple girişi başarısız');
    } finally {
      setAppleBusy(false);
    }
  }

  const locked = busy || googleBusy || appleBusy;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <PageHeader
          kicker="Müşteri"
          heading="Giriş"
          subtitle="Google veya e-posta ile alışveriş hesabınıza girin."
        />
        <Pressable onPress={() => void onGoogle()} disabled={locked} style={[btn, { opacity: googleBusy ? 0.6 : 1 }]}>
          <Text style={btnText}>{googleBusy ? 'Google açılıyor…' : 'Google ile giriş'}</Text>
        </Pressable>
        {appleOk ? (
          <Pressable onPress={() => void onApple()} disabled={locked} style={btnGhost}>
            <Text style={btnGhostText}>{appleBusy ? 'Apple…' : 'Apple ile giriş'}</Text>
          </Pressable>
        ) : null}
        <Text style={{ color: colors.muted, marginTop: 20, textAlign: 'center', fontSize: 10, letterSpacing: 2 }}>
          VEYA E-POSTA
        </Text>
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
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />
        {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
        <Pressable onPress={() => void submit()} disabled={locked} style={btnGhost}>
          <Text style={btnGhostText}>{busy ? 'Giriş…' : 'E-posta ile giriş'}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ShopRegister')} style={{ marginTop: 20 }}>
          <Text style={link}>Hesap oluştur</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: 12 }}>
          <Text style={link}>Şifremi unuttum</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
