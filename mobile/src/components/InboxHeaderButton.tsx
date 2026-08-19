import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fetchUnread, onInboxRefresh } from '../lib/inbox';
import { navigate } from '../lib/navigation';
import { colors } from '../ui';

function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  badge,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={{
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name={icon} size={20} color={colors.accentSoft} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 3,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function InboxHeaderButton() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    function load() {
      void fetchUnread()
        .then((r) => setUnread(r.count))
        .catch(() => undefined);
    }
    load();
    const poll = setInterval(load, 40000);
    const off = onInboxRefresh(load);
    return () => {
      clearInterval(poll);
      off();
    };
  }, []);

  return (
    <HeaderIconButton
      icon="bell"
      accessibilityLabel="Bildirimler"
      badge={unread}
      onPress={() => navigate('Notifications')}
    />
  );
}

export function StaffHomeHeaderRight({ onSearch }: { onSearch: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <HeaderIconButton icon="search" accessibilityLabel="Ara" onPress={onSearch} />
      <InboxHeaderButton />
    </View>
  );
}
