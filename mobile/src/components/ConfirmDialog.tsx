import { Modal, Pressable, Text, View } from 'react-native';
import { btn, btnText, colors } from '../ui';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.72)',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 20 }}
        >
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 2 }}>ONAY</Text>
          <Text style={{ color: colors.text, fontSize: 18, marginTop: 8 }}>{title}</Text>
          {description ? (
            <Text style={{ color: colors.muted, marginTop: 10, lineHeight: 20 }}>{description}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
            <Pressable
              onPress={onCancel}
              style={{ flex: 1, borderWidth: 1, borderColor: colors.border, padding: 12 }}
            >
              <Text style={{ color: colors.muted, textAlign: 'center' }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[btn, { flex: 1, marginTop: 0, backgroundColor: danger ? colors.danger : colors.accent }]}
            >
              <Text style={btnText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
