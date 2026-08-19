import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { restoreShopSession } from '../../lib/api';
import { shopChangePassword, shopMe } from '../../lib/shop-api';
import type { ShopUser } from '../../lib/shop-types';
import { btn, btnText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<ShopUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const session = await restoreShopSession();
        if (!session) {
          navigation.replace('ShopLogin');
          return;
        }
        try {
          setUser(await shopMe());
        } catch {
          navigation.replace('ShopLogin');
        }
      })();
    }, [navigation]),
  );

  async function submit() {
    setError('');
    setOk('');
    if (password !== password2) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setBusy(true);
    try {
      await shopChangePassword({
        currentPassword: currentPassword || undefined,
        password,
      });
      setOk('Şifre güncellendi.');
      setCurrentPassword('');
      setPassword('');
      setPassword2('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    } finally {
      setBusy(false);
    }
  }

  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader kicker="Hesap" heading="Profil" subtitle="İletişim bilgileri ve şifre." />
      {user ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surface,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{name}</Text>
          <Text style={[muted, { marginTop: 6 }]}>{user.email}</Text>
          {user.phone ? <Text style={[muted, { marginTop: 4 }]}>{user.phone}</Text> : null}
        </View>
      ) : null}
      <SectionLabel label="Şifre değiştir" />
      <Field
        title="Mevcut şifre"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Varsa"
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        title="Yeni şifre"
        value={password}
        onChangeText={setPassword}
        placeholder="Yeni şifre"
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        title="Yeni şifre (tekrar)"
        value={password2}
        onChangeText={setPassword2}
        placeholder="Tekrar"
        secureTextEntry
        autoCapitalize="none"
      />
      {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
      {ok ? <Text style={{ color: colors.success, marginTop: 10 }}>{ok}</Text> : null}
      <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
        <Text style={btnText}>{busy ? 'Kaydediliyor…' : 'Şifreyi güncelle'}</Text>
      </Pressable>
    </ScrollView>
  );
}
