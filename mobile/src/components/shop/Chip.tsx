import { Pressable, Text } from 'react-native';
import { colors } from '../../ui';

export function Chip({
  label,
  selected,
  onPress,
  filled,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  filled?: boolean;
}) {
  const on = selected || filled;
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginRight: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: on ? colors.accent : colors.border,
        backgroundColor: filled ? colors.accent : on ? colors.surfaceHigh : 'transparent',
        paddingHorizontal: 14,
        paddingVertical: 9,
      }}
    >
      <Text
        style={{
          color: filled ? '#fff' : on ? colors.accentSoft : colors.text,
          fontSize: 12,
          letterSpacing: 0.6,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
