import { Pressable, Text, View } from 'react-native';
import { colors } from '../ui';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Switch({ checked, onChange, label }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: 1,
          borderColor: checked ? colors.accent : colors.border,
          backgroundColor: checked ? colors.accent : colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
      </View>
      {label ? <Text style={{ color: colors.text, fontSize: 14 }}>{label}</Text> : null}
    </Pressable>
  );
}
