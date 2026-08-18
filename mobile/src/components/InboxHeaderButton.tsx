import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fetchUnread, onInboxRefresh } from '../lib/inbox';
import { navigate } from '../lib/navigation';

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
    <Pressable
      onPress={() => navigate('Notifications')}
      style={{ marginRight: 14, padding: 4 }}
      accessibilityLabel="Bildirimler"
    >
      <View>
        <Feather name="bell" size={22} color="#ffb4a2" />
        {unread > 0 ? (
          <View
            style={{
              position: 'absolute',
              right: -6,
              top: -4,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 3,
              backgroundColor: '#cc5b3e',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
              {unread > 9 ? '9+' : unread}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
