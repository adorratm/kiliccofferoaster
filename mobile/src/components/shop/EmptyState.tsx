import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { body, btn, btnText, colors } from '../../ui';

export function EmptyState({
  icon,
  title,
  body: copy,
  actionLabel,
  onAction,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Feather name={icon} size={22} color={colors.accentSoft} />
      </View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>{title}</Text>
      {copy ? (
        <Text style={[body, { marginTop: 8, textAlign: 'center', paddingHorizontal: 24 }]}>{copy}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={[btn, { alignSelf: 'stretch', marginHorizontal: 24 }]}>
          <Text style={btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
