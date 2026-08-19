import { Pressable, Text, View } from 'react-native';
import { colors } from '../../ui';

export function QtyStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Pressable
        onPress={() => onChange(value - 1)}
        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: colors.accentSoft, fontSize: 18 }}>−</Text>
      </Pressable>
      <View style={{ width: 36, alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{value}</Text>
      </View>
      <Pressable
        onPress={() => onChange(value + 1)}
        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: colors.accentSoft, fontSize: 18 }}>+</Text>
      </Pressable>
    </View>
  );
}
