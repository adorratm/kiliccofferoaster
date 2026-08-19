import { Text, View } from 'react-native';
import { body, colors, eyebrow, title } from '../../ui';

export function PageHeader({
  kicker,
  heading,
  subtitle,
}: {
  kicker?: string;
  heading: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      {kicker ? <Text style={eyebrow}>{kicker}</Text> : null}
      <Text style={[title, { marginTop: kicker ? 8 : 0, fontSize: 32, lineHeight: 36 }]}>
        {heading}
      </Text>
      {subtitle ? <Text style={[body, { marginTop: 10 }]}>{subtitle}</Text> : null}
      <View
        style={{
          marginTop: 18,
          height: 1,
          backgroundColor: colors.borderMuted,
        }}
      />
    </View>
  );
}
