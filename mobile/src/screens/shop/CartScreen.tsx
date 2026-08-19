import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CartStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { Field } from '../../components/shop/Field';
import { RemoteImage } from '../../components/shop/RemoteImage';
import { PageHeader } from '../../components/shop/PageHeader';
import { QtyStepper } from '../../components/shop/QtyStepper';
import { useShopCart } from '../../lib/shop-cart';
import {
  cartSubtotal,
  shopRemoveCartItem,
  shopSetGuestEmail,
  shopUpdateCartItem,
} from '../../lib/shop-api';
import { getShopToken } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { grindLabel } from '../../lib/grind';
import { btn, btnText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { cart, refresh } = useShopCart();
  const [msg, setMsg] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [loggedIn, setLoggedIn] = useState(true);
  const [emailBusy, setEmailBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await refresh();
        const token = await getShopToken();
        setLoggedIn(Boolean(token));
      })();
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      if (cart?.guestEmail) setGuestEmail(cart.guestEmail);
    }, [cart?.guestEmail]),
  );

  async function saveGuestEmail() {
    const email = guestEmail.trim();
    if (!email) return;
    setEmailBusy(true);
    setEmailMsg('');
    try {
      await shopSetGuestEmail(email);
      await refresh();
      setEmailMsg('E-posta kaydedildi. Sepet hatırlatması için kullanılır.');
    } catch (e) {
      setEmailMsg(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setEmailBusy(false);
    }
  }

  const items = cart?.items ?? [];
  const subtotal = cartSubtotal(cart);

  async function changeQty(id: string, quantity: number) {
    try {
      if (quantity < 1) await shopRemoveCartItem(id);
      else await shopUpdateCartItem(id, quantity);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void refresh()} tintColor={colors.accent} />
      }
    >
      <PageHeader
        kicker="Sipariş"
        heading="Sepet"
        subtitle={items.length ? `${items.length} kalem hazır.` : 'Henüz ürün yok.'}
      />
      {msg ? <Text style={{ color: colors.danger, marginTop: 8 }}>{msg}</Text> : null}
      {!items.length ? (
        <EmptyState
          icon="shopping-bag"
          title="Sepetiniz boş"
          body="Kataloğdan taze kavrulmuş bir kahve ekleyin."
          actionLabel="Mağazaya git"
          onAction={() => navigation.getParent()?.navigate('ShopTab' as never)}
        />
      ) : (
        items.map((item) => (
            <View
              key={item.id}
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: colors.borderMuted,
                backgroundColor: colors.surface,
                padding: 12,
                flexDirection: 'row',
              }}
            >
              <RemoteImage
                uri={item.product?.imageUrl}
                seed={item.product?.slug}
                width={72}
                height={88}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {item.product?.name || 'Ürün'}
                </Text>
                <Text style={[muted, { marginTop: 4 }]}>
                  {[item.variant?.weightLabel, item.grindOption ? grindLabel(item.grindOption) : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text style={{ color: colors.accentSoft, marginTop: 8, fontWeight: '600' }}>
                  {formatMoney(Number(item.unitPrice) * item.quantity)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
                  <QtyStepper value={item.quantity} onChange={(n) => void changeQty(item.id, n)} />
                  <Pressable onPress={() => void changeQty(item.id, 0)}>
                    <Text style={{ color: colors.danger, fontSize: 12, letterSpacing: 0.8 }}>Kaldır</Text>
                  </Pressable>
                </View>
              </View>
            </View>
        ))
      )}
      {items.length ? (
        <View
          style={{
            marginTop: 24,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[muted, { letterSpacing: 1.4, textTransform: 'uppercase' }]}>Ara toplam</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{formatMoney(subtotal)}</Text>
          </View>
          {!loggedIn ? (
            <View style={{ marginTop: 8 }}>
              <Field
                title="E-posta (opsiyonel hatırlatma)"
                value={guestEmail}
                onChangeText={setGuestEmail}
                placeholder="ornek@posta.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => void saveGuestEmail()}
                disabled={emailBusy || !guestEmail.trim()}
                style={[btn, { opacity: emailBusy || !guestEmail.trim() ? 0.5 : 1 }]}
              >
                <Text style={btnText}>{emailBusy ? 'Kaydediliyor…' : 'E-posta kaydet'}</Text>
              </Pressable>
              {emailMsg ? (
                <Text
                  style={{
                    color: emailMsg.includes('kaydedildi') ? colors.success : colors.danger,
                    marginTop: 8,
                    fontSize: 12,
                  }}
                >
                  {emailMsg}
                </Text>
              ) : null}
            </View>
          ) : null}
          <Pressable onPress={() => navigation.navigate('Checkout')} style={btn}>
            <Text style={btnText}>Ödemeye geç</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
    </SafeAreaView>
  );
}
