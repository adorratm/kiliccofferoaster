import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AccountStackParamList } from '../../navigation/types';
import { MenuRow } from '../../components/shop/MenuRow';
import { PageHeader } from '../../components/shop/PageHeader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { restoreShopSession, setShopToken } from '../../lib/api';
import { shopMe } from '../../lib/shop-api';
import { useStaffSession } from '../../lib/staff-session';
import type { ShopUser } from '../../lib/shop-types';
import { LEGAL_LINKS } from '../../lib/cms';
import { manualUpdateCheck } from '../../lib/updates';
import { btn, btnGhost, btnGhostText, btnText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Account'>;

function initialsOf(user: ShopUser) {
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  if (parts.length) return parts.map((p) => p[0]?.toUpperCase()).join('').slice(0, 2);
  return user.email.slice(0, 2).toUpperCase();
}

export function AccountScreen({ navigation }: Props) {
  const { refreshStaff } = useStaffSession();
  const [user, setUser] = useState<ShopUser | null>(null);
  const [ready, setReady] = useState(false);
  const [updateHint, setUpdateHint] = useState('');

  const onCheckUpdate = useCallback(async () => {
    setUpdateHint('Kontrol ediliyor…');
    const msg = await manualUpdateCheck();
    setUpdateHint(msg);
  }, []);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        <PageHeader
          kicker="Hesap"
          heading="Giriş yapın"
          subtitle="Sipariş, adres ve favoriler için müşteri hesabınızı kullanın."
        />
        <Pressable onPress={() => navigation.navigate('ShopLogin')} style={btn}>
          <Text style={btnText}>Giriş yap</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ShopRegister')} style={btnGhost}>
          <Text style={btnGhostText}>Hesap oluştur</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 13 }}>Şifremi unuttum</Text>
        </Pressable>
        <InfoLinks
          onLookup={() => navigation.navigate('OrderLookup')}
          onTrack={() => navigation.navigate('Tracking')}
          onLegal={(slug) => navigation.navigate('Legal', { slug })}
          onCheckUpdate={() => void onCheckUpdate()}
          updateHint={updateHint}
          onShop={(screen) =>
            navigation.getParent()?.navigate('ShopTab', { screen } as never)
          }
        />
      </ScrollView>
      </SafeAreaView>
    );
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderWidth: 1,
            borderColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <Text style={{ color: colors.accentSoft, fontSize: 18, fontWeight: '700', letterSpacing: 1 }}>
            {initialsOf(user)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.accentSoft, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
            Hesabım
          </Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 4 }}>{name}</Text>
          <Text style={[muted, { marginTop: 4 }]}>{user.email}</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: colors.borderMuted, marginVertical: 16 }} />

      <SectionLabel index="01" label="Sipariş" />
      <MenuRow
        icon="package"
        label="Siparişlerim"
        hint="Durum ve geçmiş"
        onPress={() => navigation.navigate('Orders')}
      />
      <MenuRow
        icon="map-pin"
        label="Adreslerim"
        hint="Teslimat kayıtları"
        onPress={() => navigation.navigate('Addresses')}
      />
      <MenuRow
        icon="heart"
        label="Favoriler"
        hint="Kaydettiğiniz kahveler"
        onPress={() => navigation.navigate('Favorites')}
      />
      <MenuRow
        icon="bell"
        label="Bildirimler"
        hint="Sipariş ve kargo"
        onPress={() => navigation.navigate('Inbox')}
      />
      <MenuRow
        icon="user"
        label="Profil / şifre"
        hint="Hesap bilgileri"
        onPress={() => navigation.navigate('Profile')}
      />

      <InfoLinks
        onLookup={() => navigation.navigate('OrderLookup')}
        onTrack={() => navigation.navigate('Tracking')}
        onLegal={(slug) => navigation.navigate('Legal', { slug })}
        onCheckUpdate={() => void onCheckUpdate()}
        updateHint={updateHint}
        onShop={(screen) =>
          navigation.getParent()?.navigate('ShopTab', { screen } as never)
        }
      />
      <Pressable
        onPress={async () => {
          await setShopToken(null);
          await refreshStaff();
          setUser(null);
        }}
        style={{ marginTop: 28, paddingVertical: 12 }}
      >
        <Text style={{ color: colors.muted, textAlign: 'center', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 11 }}>
          Çıkış yap
        </Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView>
  );
}

function InfoLinks({
  onLookup,
  onTrack,
  onLegal,
  onShop,
  onCheckUpdate,
  updateHint,
}: {
  onLookup: () => void;
  onTrack: () => void;
  onLegal: (slug: string) => void;
  onShop: (screen: 'About' | 'Faq' | 'BlogList' | 'Contact') => void;
  onCheckUpdate: () => void;
  updateHint?: string;
}) {
  return (
    <View>
      <SectionLabel index="02" label="Destek" />
      <MenuRow icon="search" label="Sipariş sorgula" hint="Misafir sipariş no" onPress={onLookup} />
      <MenuRow icon="truck" label="Kargo takip" hint="Takip kodu" onPress={onTrack} />
      <MenuRow
        icon="refresh-cw"
        label="Güncelleme kontrol et"
        hint={updateHint || 'OTA güncellemesi'}
        onPress={onCheckUpdate}
      />
      <MenuRow icon="info" label="Hakkımızda" onPress={() => onShop('About')} />
      <MenuRow icon="book-open" label="Blog" onPress={() => onShop('BlogList')} />
      <MenuRow icon="help-circle" label="SSS" onPress={() => onShop('Faq')} />
      <MenuRow icon="mail" label="İletişim" onPress={() => onShop('Contact')} />
      <SectionLabel index="03" label="Yasal" />
      {LEGAL_LINKS.map((item) => (
        <MenuRow key={item.slug} icon="file-text" label={item.label} onPress={() => onLegal(item.slug)} />
      ))}
    </View>
  );
}
