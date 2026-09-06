import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../ui';

type Props = {
  children: ReactNode;
  /** Stack header varken true (varsayılan). Header yoksa false. */
  withHeader?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Form ekranları için ortak klavye kaçınma: KAV + ScrollView.
 * Android'de app.json `softwareKeyboardLayoutMode: "resize"` ile birlikte çalışır.
 */
export function KeyboardScreen({
  children,
  withHeader = true,
  contentContainerStyle,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  // native-stack header ~44–56 + status; SafeArea üst inset ile yaklaşık offset
  const headerOffset = withHeader
    ? Platform.OS === 'ios'
      ? Math.max(insets.top, 20) + 44
      : 56
    : Platform.OS === 'ios'
      ? insets.top
      : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, style]}
      behavior="padding"
      keyboardVerticalOffset={headerOffset}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 64,
    flexGrow: 1,
  },
});
