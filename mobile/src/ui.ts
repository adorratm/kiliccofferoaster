import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bg: '#131313',
  surface: '#1c1b1b',
  border: '#57423d',
  text: '#e5e2e1',
  muted: '#a58b84',
  accent: '#cc5b3e',
  accentSoft: '#ffb4a2',
  danger: '#c45c5c',
  success: '#6b9f7a',
};

export const screen: ViewStyle = { flex: 1, backgroundColor: colors.bg, padding: 16 };
export const input: TextStyle = {
  marginTop: 8,
  borderWidth: 1,
  borderColor: colors.border,
  color: colors.text,
  padding: 12,
};
export const btn: ViewStyle = { marginTop: 12, backgroundColor: colors.accent, padding: 14 };
export const btnText: TextStyle = { color: '#fff', textAlign: 'center' };
export const card: ViewStyle = {
  marginTop: 12,
  borderWidth: 1,
  borderColor: colors.border,
  padding: 14,
  backgroundColor: colors.surface,
};
export const muted: TextStyle = { color: colors.muted, fontSize: 12 };
export const title: TextStyle = { color: colors.text, fontSize: 22, fontWeight: '600' };
