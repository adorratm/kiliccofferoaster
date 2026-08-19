import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../ui';

export function ExploreTile({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '48%',
        marginTop: 10,
        borderWidth: 1,
        borderColor: colors.borderMuted,
        backgroundColor: pressed ? colors.surfaceHigh : colors.surface,
        padding: 14,
        minHeight: 108,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Feather name={icon} size={14} color={colors.accentSoft} />
      </View>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
      {hint ? (
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4, letterSpacing: 0.3 }}>
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}
