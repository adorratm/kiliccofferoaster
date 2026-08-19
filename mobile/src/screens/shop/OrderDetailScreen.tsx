import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { StatusBadge } from '../../components/shop/StatusBadge';
import {
  shopCreateReturnRequest,
  shopOrder,
  shopReturnRequests,
} from '../../lib/shop-api';
import { formatMoney } from '../../lib/format';
import { orderStatusHint } from '../../lib/order-status';
import type { Order, ReturnRequest, ReturnRequestType } from '../../lib/shop-types';
import { btn, btnText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'OrderDetail'>;

export function OrderDetailScreen({ route }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [returnType, setReturnType] = useState<ReturnRequestType>('return');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const next = await shopOrder(route.params.id).catch(() => null);
    setOrder(next);
    if (next) {
      const list = await shopReturnRequests(next.id).catch(() => []);
      setReturns(Array.isArray(list) ? list : []);
    }
  }

  useEffect(() => {
    void load();
  }, [route.params.id]);

  if (!order) return <ScreenLoader />;

  const hint = orderStatusHint(order.status);
  const openReturn = returns.find(
    (r) => r.status === 'requested' || r.status === 'approved',
  );
  const canCancel = !openReturn && ['pending', 'paid', 'processing'].includes(order.status);
  const canReturn = !openReturn && ['shipped', 'delivered'].includes(order.status);
  const effectiveType: ReturnRequestType = canReturn && returnType === 'return' ? 'return' : canCancel ? 'cancel' : returnType;

  async function submitReturn() {
    setMsg('');
    if (reason.trim().length < 10) {
      setMsg('Açıklama en az 10 karakter olmalı.');
      return;
    }
    setBusy(true);
    try {
      await shopCreateReturnRequest(order!.id, {
        type: effectiveType,
        reason: reason.trim(),
      });
      setReason('');
      setMsg('Talebiniz alındı.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gönderilemedi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <PageHeader kicker="Sipariş" heading={order.orderNumber} />
      <StatusBadge status={order.status} />
      {hint ? <Text style={[muted, { marginTop: 12, lineHeight: 20 }]}>{hint}</Text> : null}

      {order.items?.map((item) => (
        <View
          key={item.id}
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surface,
            padding: 14,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>{item.productName}</Text>
          <Text style={[muted, { marginTop: 6 }]}>
            {[item.variantLabel, item.grindLabel].filter(Boolean).join(' · ')}
            {item.quantity ? ` · ${item.quantity} adet` : ''}
          </Text>
          <Text style={{ color: colors.accentSoft, marginTop: 8 }}>{formatMoney(item.lineTotal || item.unitPrice)}</Text>
        </View>
      ))}

      <View
        style={{
          marginTop: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          backgroundColor: colors.surface,
        }}
      >
        <Row label="Ara toplam" value={formatMoney(order.subtotal, order.currency)} />
        <Row label="Kargo" value={formatMoney(order.shippingFee, order.currency)} />
        {Number(order.discountAmount) ? (
          <Row label="İndirim" value={`−${formatMoney(order.discountAmount, order.currency)}`} />
        ) : null}
        <View style={{ height: 1, backgroundColor: colors.borderMuted, marginVertical: 12 }} />
        <Row label="Toplam" value={formatMoney(order.total, order.currency)} strong />
      </View>

      {returns.length ? (
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accentSoft, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
            Talepler
          </Text>
          {returns.map((item) => (
            <Text key={item.id} style={[muted, { marginTop: 8 }]}>
              {item.type === 'cancel' ? 'İptal' : 'İade'} · {item.status}
            </Text>
          ))}
        </View>
      ) : null}

      {canCancel || canReturn ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
            {canCancel ? 'İptal talebi' : 'İade talebi'}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            {canCancel ? (
              <Pressable
                onPress={() => setReturnType('cancel')}
                style={{
                  borderWidth: 1,
                  borderColor: returnType === 'cancel' ? colors.accent : colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.accentSoft }}>İptal</Text>
              </Pressable>
            ) : null}
            {canReturn ? (
              <Pressable
                onPress={() => setReturnType('return')}
                style={{
                  borderWidth: 1,
                  borderColor: returnType === 'return' ? colors.accent : colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.accentSoft }}>İade</Text>
              </Pressable>
            ) : null}
          </View>
          <Field
            title="Açıklama"
            value={reason}
            onChangeText={setReason}
            placeholder="En az 10 karakter"
            multiline
          />
          {msg ? (
            <Text style={{ color: msg.includes('alındı') ? colors.success : colors.danger, marginTop: 8 }}>
              {msg}
            </Text>
          ) : null}
          <Pressable onPress={() => void submitReturn()} disabled={busy} style={btn}>
            <Text style={btnText}>{busy ? 'Gönderiliyor…' : 'Talep gönder'}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
      <Text style={strong ? { color: colors.text, fontWeight: '700' } : muted}>{label}</Text>
      <Text style={{ color: strong ? colors.accentSoft : colors.text, fontWeight: strong ? '700' : '400' }}>{value}</Text>
    </View>
  );
}
