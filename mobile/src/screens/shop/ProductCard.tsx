import { Pressable, Text, View } from 'react-native';
import { RemoteImage } from '../../components/shop/RemoteImage';
import { formatMoney } from '../../lib/format';
import { productOrigin, roastLabel } from '../../lib/order-status';
import type { Product } from '../../lib/shop-types';
import { colors, muted, price } from '../../ui';

export function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const amount = product.salePrice ?? product.basePrice;
  const compare = product.compareAtPrice;
  const meta = [productOrigin(product.originCountry, product.originRegion), roastLabel(product.roastLevel)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        margin: 6,
        borderWidth: 1,
        borderColor: pressed ? colors.accent : colors.borderMuted,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      })}
    >
      <View style={{ height: 168, backgroundColor: colors.surfaceHigh }}>
        <RemoteImage uri={product.imageUrl} seed={product.slug} height={168} />
        {product.badge ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: colors.accent,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {product.badge}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14, lineHeight: 18 }} numberOfLines={2}>
          {product.name}
        </Text>
        {meta ? (
          <Text style={[muted, { marginTop: 6, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {product.campaignName ? (
          <Text style={[muted, { marginTop: 4 }]} numberOfLines={1}>
            {product.campaignName}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, gap: 8 }}>
          <Text style={price}>{formatMoney(amount, product.currency)}</Text>
          {compare && Number(compare) > Number(amount) ? (
            <Text style={{ color: colors.muted, fontSize: 11, textDecorationLine: 'line-through' }}>
              {formatMoney(compare, product.currency)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
