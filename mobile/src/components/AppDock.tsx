import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../ui';

export function AppDock({
  active,
  onShop,
  onStaff,
}: {
  active: 'shop' | 'staff';
  onShop: () => void;
  onStaff: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.bg,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      <Pressable
        onPress={onShop}
        style={{ flex: 1, paddingTop: 12, paddingBottom: 8 }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: active === 'shop' ? colors.accentSoft : colors.muted,
            fontWeight: active === 'shop' ? '600' : '400',
          }}
        >
          Mağaza
        </Text>
      </Pressable>
      <Pressable
        onPress={onStaff}
        style={{ flex: 1, paddingTop: 12, paddingBottom: 8 }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: active === 'staff' ? colors.accentSoft : colors.muted,
            fontWeight: active === 'staff' ? '600' : '400',
          }}
        >
          Personel
        </Text>
      </Pressable>
    </View>
  );
}
