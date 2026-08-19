import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { shopInbox, shopInboxMarkAllRead, shopInboxMarkRead } from '../../lib/shop-api';
import type { InboxItem } from '../../lib/shop-types';
import { btnGhost, btnGhostText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Inbox'>;

export function InboxScreen(_props: Props) {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await shopInbox();
      setItems(res.items || []);
      setError('');
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function open(item: InboxItem) {
    if (!item.readAt) {
      await shopInboxMarkRead(item.id).catch(() => undefined);
    }
    void load();
  }

  if (!items) return <ScreenLoader />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <PageHeader kicker="Hesap" heading="Bildirimler" />
      {items.length ? (
        <Pressable
          onPress={() => void shopInboxMarkAllRead().then(load)}
          style={btnGhost}
        >
          <Text style={btnGhostText}>Tümünü okundu işaretle</Text>
        </Pressable>
      ) : null}
      {error ? <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text> : null}
      {!items.length ? (
        <EmptyState icon="bell" title="Bildirim yok" body="Sipariş ve kargo güncellemeleri burada görünür." />
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => void open(item)}
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: item.readAt ? colors.borderMuted : colors.accent,
              backgroundColor: colors.surface,
              padding: 14,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>{item.title}</Text>
            <Text style={[muted, { marginTop: 6, lineHeight: 20 }]}>{item.body}</Text>
            {item.createdAt ? (
              <Text style={[muted, { marginTop: 8, fontSize: 11 }]}>
                {new Date(item.createdAt).toLocaleString('tr-TR')}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
