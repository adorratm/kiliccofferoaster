import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { RootStack } from '../../App';
import { Switch } from '../components/Switch';
import { api } from '../lib/api';
import { fetchInbox, fetchPrefs, onInboxRefresh, type InboxItem, type NotificationPrefs } from '../lib/inbox';
import { openOpsHref } from '../lib/navigation';
import { card, colors, muted, screen, title } from '../ui';

type Props = NativeStackScreenProps<RootStack, 'Notifications'>;

const TOGGLES: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'inAppEnabled', label: 'Uygulama içi bildirimler' },
  { key: 'pushEnabled', label: 'Push bildirimleri (uygulama kapalıyken)' },
  { key: 'opsOrdersEnabled', label: 'Yeni ödemeler / siparişler' },
  { key: 'opsReturnsEnabled', label: 'İade talepleri' },
  { key: 'opsMessagesEnabled', label: 'İletişim mesajları' },
  { key: 'opsReviewsEnabled', label: 'Ürün yorumları' },
  { key: 'opsStockEnabled', label: 'Düşük stok' },
];

export function NotificationsScreen(_props: Props) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [inbox, p] = await Promise.all([fetchInbox(), fetchPrefs()]);
    setItems(inbox.items || []);
    setPrefs(p);
  }, []);

  useEffect(() => {
    void load().catch(() => setError('Bildirimler yüklenemedi'));
    const off = onInboxRefresh(() => {
      void load().catch(() => undefined);
    });
    return off;
  }, [load]);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    const next = await api<NotificationPrefs>('/notifications/preferences', {
      method: 'PATCH',
      body: { [key]: value },
    });
    setPrefs(next);
  }

  async function openItem(item: InboxItem) {
    if (!item.readAt) {
      await api(`/notifications/inbox/${item.id}/read`, { method: 'PATCH' }).catch(
        () => undefined,
      );
    }
    openOpsHref(item.href);
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Bildirimler</Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}

      {prefs ? (
        <View style={{ marginTop: 16 }}>
          <Text style={muted}>TERCİHLER</Text>
          {TOGGLES.map((row) => (
            <View key={row.key} style={[card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
              <Text style={{ color: colors.text, flex: 1, marginRight: 12 }}>{row.label}</Text>
              <Switch
                checked={Boolean(prefs[row.key])}
                onChange={(v) => void toggle(row.key, v)}
              />
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: 24, marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={muted}>GELEN KUTUSU</Text>
        <Pressable
          onPress={() =>
            void api('/notifications/inbox/read-all', { method: 'PATCH' }).then(() => load())
          }
        >
          <Text style={{ color: colors.accentSoft }}>Tümünü oku</Text>
        </Pressable>
      </View>
      {!items.length ? (
        <Text style={muted}>Bildirim yok</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => void openItem(item)}
            style={[card, { opacity: item.readAt ? 0.55 : 1 }]}
          >
            <Text style={{ color: colors.text }}>{item.title}</Text>
            <Text style={[muted, { marginTop: 4 }]}>{item.body}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
