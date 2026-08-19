import { ActivityIndicator, View } from 'react-native';
import { colors } from '../../ui';

export function ScreenLoader() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
