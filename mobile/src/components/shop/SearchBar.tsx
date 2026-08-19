import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../ui';

export function SearchBar({
  value,
  placeholder,
  onChangeText,
  onSubmit,
  editable = true,
  onPress,
}: {
  value?: string;
  placeholder: string;
  onChangeText?: (v: string) => void;
  onSubmit?: () => void;
  editable?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        paddingVertical: editable ? 4 : 14,
      }}
    >
      <Feather name="search" size={16} color={colors.muted} />
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          returnKeyType="search"
          style={{
            flex: 1,
            marginLeft: 10,
            color: colors.text,
            paddingVertical: 12,
            fontSize: 15,
          }}
        />
      ) : (
        <Text style={{ flex: 1, marginLeft: 10, color: colors.muted, fontSize: 15 }}>
          {placeholder}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
}
