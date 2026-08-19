import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../ui';

export function MenuRow({
  icon,
  label,
  hint,
  onPress,
  danger,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.borderMuted,
        backgroundColor: pressed ? colors.surfaceHigh : colors.surface,
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Feather name={icon} size={16} color={danger ? colors.danger : colors.accentSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? colors.danger : colors.text, fontSize: 15, fontWeight: '600' }}>
          {label}
        </Text>
        {hint ? (
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3, letterSpacing: 0.4 }}>
            {hint}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.muted} />
    </Pressable>
  );
}
