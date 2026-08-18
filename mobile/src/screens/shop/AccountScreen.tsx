import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AccountStackParamList } from '../../navigation/types';
import { restoreShopSession, setShopToken } from '../../lib/api';
import { shopMe } from '../../lib/shop-api';
import type { ShopUser } from '../../lib/shop-types';
import { btn, btnText, card, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Account'>;

export function AccountScreen({ navigation }: Props) {
  const [user, setUser] = useState<ShopUser | null>(null);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const ok = await restoreShopSession();
        if (!ok) {
          setUser(null);
          setReady(true);
          return;
        }
        try {
          setUser(await shopMe());
        } catch {
          setUser(null);
        }
        setReady(true);
      })();
    }, []),
  );

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
        <Text style={title}>Hesabım</Text>
        <Text style={[muted, { marginTop: 12 }]}>Sipariş ve adresler için giriş yapın.</Text>
        <Pressable onPress={() => navigation.navigate('ShopLogin')} style={btn}>
          <Text style={btnText}>Giriş yap</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ShopRegister')} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.accentSoft, textAlign: 'center' }}>Hesap oluştur</Text>
        </Pressable>
      </View>
    );
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={title}>{name}</Text>
      <Text style={[muted, { marginTop: 6 }]}>{user.email}</Text>
      <Pressable onPress={() => navigation.navigate('Orders')} style={card}>
        <Text style={{ color: colors.accentSoft }}>Siparişlerim</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Addresses')} style={card}>
        <Text style={{ color: colors.accentSoft }}>Adreslerim</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Favorites')} style={card}>
        <Text style={{ color: colors.accentSoft }}>Favoriler</Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await setShopToken(null);
          setUser(null);
        }}
        style={{ marginTop: 24 }}
      >
        <Text style={{ color: colors.muted, textAlign: 'center' }}>Çıkış yap</Text>
      </Pressable>
    </ScrollView>
  );
}
