import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  AppState,
  InteractionManager,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CartStackParamList } from '../../navigation/types';
import { useShopCart } from '../../lib/shop-cart';
import { shopOrder } from '../../lib/shop-api';
import { openPaytrBrowser } from '../../lib/paytr-browser';
import { btn, btnText, colors, muted, title } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'OrderResult'>;

const PAID = new Set(['paid', 'processing', 'shipped', 'delivered']);

export function OrderResultScreen({ navigation, route }: Props) {
  const { refresh } = useShopCart();
  const { ok, orderNumber, message, pendingPayment, paymentUrl, orderId } =
    route.params;

  const [checking, setChecking] = useState(false);
  const [hint, setHint] = useState(message || '');
  const [resolvedOk, setResolvedOk] = useState(Boolean(ok && !pendingPayment));
  const openedRef = useRef(false);
  const inBrowserRef = useRef(false);

  const tone = pendingPayment && !resolvedOk ? 'pending' : resolvedOk ? 'ok' : 'fail';
  const border =
    tone === 'ok' ? colors.success : tone === 'pending' ? colors.accent : colors.danger;
  const iconName = tone === 'ok' ? 'check' : tone === 'pending' ? 'credit-card' : 'x';
  const heading =
    tone === 'ok'
      ? 'Sipariş alındı'
      : tone === 'pending'
        ? 'Güvenli ödeme'
        : 'Ödeme başarısız';

  const verifyPaid = useCallback(async () => {
    if (!orderId) return false;
    try {
      const order = await shopOrder(orderId);
      return PAID.has(String(order.status || ''));
    } catch {
      return false;
    }
  }, [orderId]);

  const afterBrowser = useCallback(async () => {
    inBrowserRef.current = false;
    setChecking(true);
    setHint('Ödeme kontrol ediliyor…');
    const paid = await verifyPaid();
    setChecking(false);
    if (paid) {
      setResolvedOk(true);
      setHint('Ödemeniz alındı.');
      return;
    }
    setHint(
      'Ödeme henüz görünmüyorsa “Ödemeyi kontrol et”e basın veya sayfayı yeniden açın.',
    );
  }, [verifyPaid]);

  const openPay = useCallback(async () => {
    if (!paymentUrl) return;
    setChecking(true);
    setHint('Ödeme sayfası açılıyor…');
    inBrowserRef.current = true;

    const mode = await openPaytrBrowser(paymentUrl);

    if (mode === 'fail') {
      inBrowserRef.current = false;
      setChecking(false);
      setHint('Ödeme sayfası açılamadı. Tekrar deneyin.');
      return;
    }

    // iOS: openBrowserAsync kullanıcı kapatınca döner
    // Android: genelde hemen 'opened' — AppState ile dönüşü yakalarız
    if (Platform.OS === 'ios' || mode === 'external') {
      await afterBrowser();
      return;
    }

    setChecking(false);
    setHint(
      'Ödeme tarayıcıda açık. Bitince uygulamaya dönün veya “Ödemeyi kontrol et”e basın.',
    );
  }, [paymentUrl, afterBrowser]);

  useEffect(() => {
    if (!pendingPayment || !paymentUrl || openedRef.current || resolvedOk) {
      return;
    }
    openedRef.current = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void openPay();
    });
    return () => task.cancel();
  }, [pendingPayment, paymentUrl, resolvedOk, openPay]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || resolvedOk) return;
      if (Platform.OS === 'android' && inBrowserRef.current) {
        void afterBrowser();
        return;
      }
      if (!orderId || !pendingPayment) return;
      void (async () => {
        if (await verifyPaid()) {
          setResolvedOk(true);
          setHint('Ödemeniz alındı.');
        }
      })();
    });
    return () => sub.remove();
  }, [orderId, pendingPayment, resolvedOk, verifyPaid, afterBrowser]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderWidth: 1,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Feather name={iconName} size={28} color={border} />
      </View>
      <Text style={title}>{heading}</Text>
      {orderNumber ? (
        <Text style={[muted, { marginTop: 12, letterSpacing: 1 }]}>
          Sipariş no {orderNumber}
        </Text>
      ) : null}
      {hint ? (
        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 22 }}>{hint}</Text>
      ) : null}
      {checking ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : null}

      {tone === 'pending' && paymentUrl && !checking ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Pressable onPress={() => void openPay()} style={btn}>
            <Text style={btnText}>Ödeme sayfasını aç</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void Linking.openURL(paymentUrl).catch(() => {});
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.borderMuted,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.muted, fontWeight: '600' }}>
              Safari’de aç (yedek)
            </Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              setChecking(true);
              const paid = await verifyPaid();
              setChecking(false);
              if (paid) {
                setResolvedOk(true);
                setHint('Ödemeniz alındı.');
              } else {
                setHint(
                  'Ödeme henüz görünmüyor. Tamamladıysanız biraz bekleyip tekrar deneyin.',
                );
              }
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.accentSoft,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.accentSoft, fontWeight: '600' }}>
              Ödemeyi kontrol et
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          void refresh();
          navigation.popToTop();
        }}
        style={[
          btn,
          tone === 'pending'
            ? { backgroundColor: colors.surfaceHigh, marginTop: 12 }
            : null,
        ]}
      >
        <Text style={[btnText, tone === 'pending' ? { color: colors.text } : null]}>
          {tone === 'fail'
            ? 'Tekrar dene'
            : tone === 'pending'
              ? 'Daha sonra'
              : 'Sepete dön'}
        </Text>
      </Pressable>
    </View>
  );
}
