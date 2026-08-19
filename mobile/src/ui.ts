import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bg: '#131313',
  surface: '#1c1b1b',
  surfaceHigh: '#262525',
  border: '#57423d',
  borderMuted: '#3a3939',
  text: '#e5e2e1',
  muted: '#a58b84',
  accent: '#cc5b3e',
  accentHover: '#e46d4f',
  accentSoft: '#ffb4a2',
  accentText: '#ffdbd2',
  danger: '#c45c5c',
  success: '#6b9f7a',
  warning: '#c9a227',
};

export const screen: ViewStyle = { flex: 1, backgroundColor: colors.bg, padding: 16 };

export const input: TextStyle = {
  marginTop: 8,
  borderWidth: 1,
  borderColor: colors.borderMuted,
  backgroundColor: colors.surface,
  color: colors.text,
  paddingVertical: 14,
  paddingHorizontal: 14,
  fontSize: 15,
};

export const btn: ViewStyle = {
  marginTop: 16,
  backgroundColor: colors.accent,
  paddingVertical: 16,
  paddingHorizontal: 18,
};

export const btnText: TextStyle = {
  color: '#fff',
  textAlign: 'center',
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 1.6,
  textTransform: 'uppercase',
};

export const btnGhost: ViewStyle = {
  marginTop: 12,
  borderWidth: 1,
  borderColor: colors.border,
  paddingVertical: 14,
  paddingHorizontal: 18,
};

export const btnGhostText: TextStyle = {
  color: colors.accentSoft,
  textAlign: 'center',
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 1.6,
  textTransform: 'uppercase',
};

export const label: TextStyle = {
  color: colors.muted,
  fontSize: 10,
  fontWeight: '600',
  letterSpacing: 1.8,
  textTransform: 'uppercase',
};

export const link: TextStyle = {
  color: colors.accentSoft,
  textAlign: 'center',
  fontSize: 13,
  letterSpacing: 0.6,
};

export const card: ViewStyle = {
  marginTop: 12,
  borderWidth: 1,
  borderColor: colors.borderMuted,
  padding: 16,
  backgroundColor: colors.surface,
};

export const muted: TextStyle = {
  color: colors.muted,
  fontSize: 12,
  letterSpacing: 0.4,
};

export const title: TextStyle = {
  color: colors.text,
  fontSize: 28,
  fontWeight: '700',
  letterSpacing: 0.4,
};

export const eyebrow: TextStyle = {
  color: colors.accentSoft,
  fontSize: 10,
  fontWeight: '600',
  letterSpacing: 2.4,
  textTransform: 'uppercase',
};

export const body: TextStyle = {
  color: colors.muted,
  fontSize: 14,
  lineHeight: 22,
};

export const price: TextStyle = {
  color: colors.accentSoft,
  fontSize: 16,
  fontWeight: '600',
  letterSpacing: 0.3,
};
