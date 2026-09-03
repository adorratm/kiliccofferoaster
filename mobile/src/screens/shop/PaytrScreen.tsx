import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import type { CartStackParamList } from '../../navigation/types';
import { shopOrder } from '../../lib/shop-api';
import { colors, muted } from '../../ui';

type Props = NativeStackScreenProps<CartStackParamList, 'Paytr'>;

const PAID_STATUSES = new Set(['paid', 'processing', 'shipped', 'delivered']);

function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * PayTR: WebView ve SFSafariViewController (openBrowserAsync) YOK.
 * İkisi de production / iOS 27 Scene lifecycle altında native crash üretebiliyor.
 * Sistem Safari'ye Linking.openURL ile çıkış en güvenli yol.
 */
export function PaytrScreen({ navigation, route }: Props) {
  const { token, orderNumber, orderId, iframeUrl } = route.params;
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState(
    'Ödeme için Safari açılacak. Kart bilgilerinizi orada girin.',
  );
  const [ready, setReady] = useState(false);
  const finishedRef = useRef(false);
  const leftForSafariRef = useRef(false);

  const uri = useMemo(() => {
    const raw =
      (iframeUrl && String(iframeUrl).trim()) ||
      (token
        ? `https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`
        : '');
    if (!raw || !isSafeHttpUrl(raw)) return '';
    return raw;
  }, [iframeUrl, token]);

  const finish = useCallback(
    (ok: boolean, message?: string) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      navigation.replace('OrderResult', {
        ok,
        orderNumber,
        ...(message ? { message } : {}),
      });
    },
    [navigation, orderNumber],
  );

  const checkOrderPaid = useCallback(async (): Promise<boolean> => {
    if (!orderId) return false;
    try {
      const order = await shopOrder(orderId);
      return PAID_STATUSES.has(String(order.status || ''));
    } catch {
      return false;
    }
  }, [orderId]);

  const openInSafari = useCallback(async () => {
    if (!uri || finishedRef.current) return;
    setBusy(true);
    setStatusMsg('Safari açılıyor…');
    try {
      leftForSafariRef.current = true;
      const supported = await Linking.canOpenURL(uri);
      if (!supported) {
        leftForSafariRef.current = false;
        setStatusMsg('Bu cihazda ödeme bağlantısı açılamadı.');
        setBusy(false);
        return;
      }
      await Linking.openURL(uri);
      setStatusMsg(
        'Safari’de ödemeyi tamamlayın, sonra buraya dönüp “Ödemeyi kontrol et”e basın.',
      );
    } catch {
      leftForSafariRef.current = false;
      setStatusMsg('Safari açılamadı. Tekrar deneyin.');
    } finally {
      setBusy(false);
      setReady(true);
    }
  }, [uri]);

  useEffect(() => {
    if (!uri) {
      finish(
        false,
        orderId
          ? 'Ödeme sayfası açılamadı. Siparişiniz beklemede kalmış olabilir.'
          : 'Ödeme sayfası açılamadı',
      );
      return;
    }
    // Otomatik açma yok — kullanıcı butona bassın (presentation crash / race olmasın)
    setReady(true);
  }, [uri, orderId, finish]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || finishedRef.current || !orderId) return;
      if (!leftForSafariRef.current) return;
      void (async () => {
        setBusy(true);
        setStatusMsg('Ödeme kontrol ediliyor…');
        const paid = await checkOrderPaid();
        setBusy(false);
        if (paid) finish(true);
        else {
          setStatusMsg(
            'Ödeme henüz görünmüyor. Tamamladıysanız biraz bekleyip tekrar kontrol edin.',
          );
        }
      })();
    });
    return () => sub.remove();
  }, [orderId, checkOrderPaid, finish]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {busy ? <ActivityIndicator color={colors.accent} /> : null}
      <Text
        style={[
          muted,
          { marginTop: busy ? 16 : 0, textAlign: 'center', lineHeight: 22 },
        ]}
      >
        {statusMsg}
      </Text>
      <Text style={[muted, { marginTop: 8, textAlign: 'center', fontSize: 13 }]}>
        Sipariş: {orderNumber}
      </Text>

      {ready && !busy ? (
        <View style={{ marginTop: 28, gap: 12 }}>
          <Pressable
            onPress={() => {
              void openInSafari();
            }}
            style={{
              backgroundColor: colors.accent,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              Safari’de ödemeyi aç
            </Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              setBusy(true);
              setStatusMsg('Ödeme kontrol ediliyor…');
              const paid = await checkOrderPaid();
              setBusy(false);
              if (paid) finish(true);
              else {
                setStatusMsg(
                  'Ödeme henüz görünmüyor. Safari’de tamamladıktan sonra tekrar deneyin.',
                );
              }
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.accentSoft,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.accentSoft, fontWeight: '600' }}>
              Ödemeyi kontrol et
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              finish(
                false,
                'Ödeme tamamlanmadı. Siparişlerim’den daha sonra ödeyebilirsiniz.',
              )
            }
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: colors.muted }}>Vazgeç</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
