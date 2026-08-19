import { Text, View } from 'react-native';
import { orderStatusLabel, shipmentStatusLabel } from '../../lib/order-status';
import { colors } from '../../ui';

export function StatusBadge({
  status,
  kind = 'order',
}: {
  status: string;
  kind?: 'order' | 'shipment';
}) {
  const label = kind === 'shipment' ? shipmentStatusLabel(status) : orderStatusLabel(status);
  const tone =
    status === 'delivered'
      ? colors.success
      : status === 'cancelled' || status === 'refunded' || status === 'failed'
        ? colors.danger
        : status === 'pending_payment'
          ? colors.warning
          : colors.accentSoft;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: tone,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          color: tone,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
