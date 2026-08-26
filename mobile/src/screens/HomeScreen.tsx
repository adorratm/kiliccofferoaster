import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { RootStack } from '../../App';
import { EChart } from '../components/EChart';
import { InboxRuntime } from '../components/InboxRuntime';
import { api, isOpsRole, setToken } from '../lib/api';
import { revenueSeriesOption, statusPieOption } from '../lib/charts';
import { openShopTab } from '../lib/nav';
import { unregisterPushToken } from '../lib/push';
import { flushOutbox, pendingCount } from '../lib/sync';
import { useStaffSession } from '../lib/staff-session';
import { btn, btnText, card, colors, muted } from '../ui';

type Props = NativeStackScreenProps<RootStack, 'Home'>;

const GROUPS: { title: string; links: { label: string; to: Exclude<keyof RootStack, 'StaffLogin' | 'CustomerDetail' | 'ProductEdit'> }[] }[] = [
  {
    title: 'Muhasebe',
    links: [
      { label: 'Cari', to: 'Parties' },
      { label: 'Faturalar', to: 'Invoices' },
      { label: 'Kasa', to: 'Cash' },
      { label: 'Raporlar', to: 'Reports' },
    ],
  },
  {
    title: 'Mağaza',
    links: [
      { label: 'Ürünler', to: 'Products' },
      { label: 'Kategoriler', to: 'Categories' },
      { label: 'Siparişler', to: 'ShopOrders' },
      { label: 'Müşteriler', to: 'Customers' },
      { label: 'İadeler', to: 'Returns' },
      { label: 'Kuponlar', to: 'Coupons' },
      { label: 'Kampanyalar', to: 'Campaigns' },
      { label: 'Yorumlar', to: 'Reviews' },
      { label: 'Kargo', to: 'Shipping' },
      { label: 'Mesajlar', to: 'Messages' },
      { label: 'Bülten', to: 'Newsletter' },
    ],
  },
  {
    title: 'Sistem',
    links: [{ label: 'Bildirimler', to: 'Notifications' }],
  },
];

export function HomeScreen({ navigation }: Props) {
  const { refreshStaff } = useStaffSession();
  const [pending, setPending] = useState(0);
  const [msg, setMsg] = useState('');
  const [stats, setStats] = useState<{
    ordersToday: number;
    revenueToday: number;
    cashRevenueToday?: number;
    totalRevenueToday?: number;
    pendingOrders: number;
    lowStockCount: number;
    series: {
      date: string;
      orders: number;
      revenue: number;
      cashRevenue?: number;
    }[];
    byStatus: { status: string; label: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const me = await api<{ role: string }>('/auth/me');
        if (!isOpsRole(me.role)) {
          await setToken(null);
          openShopTab(navigation);
          navigation.replace('StaffLogin');
        }
      } catch {
        navigation.replace('StaffLogin');
      }
    })();
    void pendingCount().then(setPending);
    void api<NonNullable<typeof stats>>('/admin/stats')
      .then(setStats)
      .catch(() => undefined);
  }, [navigation]);

  async function sync() {
    try {
      const n = await flushOutbox();
      setPending(await pendingCount());
      setMsg(`${n} kayıt gönderildi`);
    } catch {
      setMsg('Çevrimdışı veya senkron hatası');
    }
  }

  return (
    <>
      <InboxRuntime />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
      <Pressable onPress={() => navigation.navigate('Search')} style={card}>
        <Text style={{ color: colors.accentSoft }}>Ara… ürün, sipariş, müşteri</Text>
        <Text style={muted}>Global arama</Text>
      </Pressable>
      <Text style={{ color: colors.muted, letterSpacing: 2, fontSize: 10, marginTop: 16 }}>SYSTEM_STATUS</Text>
      <Text style={{ color: colors.text, marginTop: 6 }}>SYNC_PENDING {pending}</Text>
      {stats ? (
        <View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={[card, { flex: 1, marginTop: 0 }]}>
              <Text style={muted}>BUGÜN</Text>
              <Text style={{ color: colors.accent, fontSize: 20, marginTop: 4 }}>{stats.ordersToday}</Text>
              <Text style={muted}>sipariş</Text>
            </View>
            <View style={[card, { flex: 1, marginTop: 0 }]}>
              <Text style={muted}>CİRO</Text>
              <Text style={{ color: colors.accent, fontSize: 16, marginTop: 4 }}>
                {Math.round(
                  stats.totalRevenueToday ??
                    stats.revenueToday + (stats.cashRevenueToday || 0),
                )}{' '}
                ₺
              </Text>
              <Text style={muted}>
                web {Math.round(stats.revenueToday)} · kasa{' '}
                {Math.round(stats.cashRevenueToday || 0)}
              </Text>
            </View>
          </View>
          {stats.series?.length ? (
            <View style={card}>
              <Text style={muted}>SON 14 GÜN</Text>
              <EChart option={revenueSeriesOption(stats.series)} height={220} />
            </View>
          ) : null}
          {stats.byStatus?.length ? (
            <View style={card}>
              <Text style={muted}>SİPARİŞ DURUMLARI</Text>
              <EChart option={statusPieOption(stats.byStatus)} height={220} />
            </View>
          ) : null}
        </View>
      ) : null}
      {GROUPS.map((g) => (
        <View key={g.title}>
          <Text style={[muted, { marginTop: 20, letterSpacing: 2 }]}>{g.title.toUpperCase()}</Text>
          {g.links.map((l) => (
            <Pressable key={l.to} onPress={() => navigation.navigate(l.to)} style={card}>
              <Text style={{ color: colors.accentSoft }}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Pressable onPress={() => void sync()} style={btn}>
        <Text style={btnText}>Senkronize et</Text>
      </Pressable>
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}
      <Pressable
        onPress={async () => {
          await unregisterPushToken().catch(() => undefined);
          await setToken(null);
          await refreshStaff();
          navigation.replace('StaffLogin');
          openShopTab(navigation);
        }}
        style={{ marginTop: 16, marginBottom: 40 }}
      >
        <Text style={{ color: colors.muted, textAlign: 'center' }}>Oturumu kapat</Text>
      </Pressable>
    </ScrollView>
      </View>
    </>
  );
}
