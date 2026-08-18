import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import type { RootStack } from '../../App';
import { api, restoreOpsSession, setToken } from '../lib/api';
import { errorFromUrl, loginWithGoogle, tokenFromUrl } from '../lib/google-login';
import { registerPushToken } from '../lib/push';
import { colors } from '../ui';

type Props = NativeStackScreenProps<RootStack, 'StaffLogin'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void restoreOpsSession().then((ok) => {
      if (ok) {
        navigation.replace('Home');
        return;
      }
      setChecking(false);
    });
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const href = window.location.href;
    const err = errorFromUrl(href);
    const token = tokenFromUrl(href);
    if (err) setError(err);
    if (!token) return;
    void setToken(token).then(async () => {
      try {
        await api<{ role: string }>('/auth/me').then(async (me) => {
          if (!['admin', 'staff', 'accountant'].includes(me.role)) {
            await setToken(null);
            setError('Bu Google hesabı personel allowlist’te değil.');
            return;
          }
          window.history.replaceState({}, '', window.location.pathname || '/');
          void registerPushToken().catch(() => undefined);
          navigation.replace('Home');
        });
      } catch {
        await setToken(null);
        setError('Google oturumu doğrulanamadı');
      }
    });
  }, [navigation]);

  async function finish(token: string) {
    await setToken(token);
    void registerPushToken().catch(() => undefined);
    navigation.replace('Home');
  }

  async function submit() {
    setError('');
    try {
      const result = await api<{ accessToken: string }>('/auth/ops-login', {
        method: 'POST',
        body: { email, password },
      });
      await setToken(result.accessToken);
      const me = await api<{ role: string }>('/auth/me');
      if (!['admin', 'staff', 'accountant'].includes(me.role)) {
        await setToken(null);
        setError('Bu hesap personel değil. Alışveriş için Mağaza ekranını kullanın.');
        return;
      }
      await finish(result.accessToken);
    } catch {
      setError('Giriş başarısız');
    }
  }

  async function onGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      const token = await loginWithGoogle();
      await setToken(token);
      const me = await api<{ role: string }>('/auth/me');
      if (!['admin', 'staff', 'accountant'].includes(me.role)) {
        await setToken(null);
        setError('Bu Google hesabı personel allowlist’te değil.');
        return;
      }
      void registerPushToken().catch(() => undefined);
      navigation.replace('Home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google girişi başarısız');
    } finally {
      setGoogleLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 }}>
      <Text style={{ color: '#a58b84', letterSpacing: 2, fontSize: 10 }}>AUTH_PROTOCOL // OPS</Text>
      <Text style={{ color: '#e5e2e1', fontSize: 28, marginTop: 8 }}>Personel girişi</Text>
      <Pressable
        onPress={() => void onGoogle()}
        disabled={googleLoading}
        style={{ marginTop: 24, backgroundColor: '#cc5b3e', padding: 14, opacity: googleLoading ? 0.6 : 1 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          {googleLoading ? 'Google açılıyor…' : 'Google ile giriş'}
        </Text>
      </Pressable>
      <Text style={{ color: '#a58b84', marginTop: 16, textAlign: 'center', fontSize: 10, letterSpacing: 2 }}>
        VEYA ŞİFRE
      </Text>
      <TextInput
        placeholder="E-posta"
        placeholderTextColor="#a58b84"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          marginTop: 16,
          borderWidth: 1,
          borderColor: '#57423d',
          color: '#e5e2e1',
          padding: 12,
        }}
      />
      <TextInput
        placeholder="Şifre"
        placeholderTextColor="#a58b84"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: '#57423d',
          color: '#e5e2e1',
          padding: 12,
        }}
      />
      {error ? <Text style={{ color: '#c45c5c', marginTop: 8 }}>{error}</Text> : null}
      <Pressable onPress={() => void submit()} style={{ marginTop: 20, borderWidth: 1, borderColor: '#57423d', padding: 14 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Şifre ile giriş</Text>
      </Pressable>
    </View>
    </View>
  );
}
