import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors, input, label } from '../../ui';

export function Field({
  title,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  multiline,
}: {
  title: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={label}>{title}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[input, multiline ? { minHeight: 110, textAlignVertical: 'top' } : null]}
      />
    </View>
  );
}
