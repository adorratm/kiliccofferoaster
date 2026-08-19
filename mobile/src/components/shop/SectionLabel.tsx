import { Text, View } from 'react-native';
import { colors, eyebrow } from '../../ui';

export function SectionLabel({
  index,
  label,
}: {
  index?: string;
  label: string;
}) {
  return (
    <View
      style={{
        marginTop: 28,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Text style={eyebrow}>
        {index ? `${index} // ${label}` : label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderMuted }} />
    </View>
  );
}
