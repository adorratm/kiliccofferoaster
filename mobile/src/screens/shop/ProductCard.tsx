import { Image, Pressable, Text, View } from 'react-native';
import { formatMoney, productImage } from '../../lib/format';
import type { Product } from '../../lib/shop-types';
import { card, colors, muted } from '../../ui';

export function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const price = product.salePrice ?? product.basePrice;
  const img = productImage(product.imageUrl);
  return (
    <Pressable onPress={onPress} style={[card, { flex: 1, margin: 6 }]}>
      {img ? (
        <Image
          source={{ uri: img }}
          style={{ width: '100%', height: 120, backgroundColor: colors.surface }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ height: 120, backgroundColor: colors.border }} />
      )}
      <Text style={{ color: colors.text, marginTop: 8, fontWeight: '600' }} numberOfLines={2}>
        {product.name}
      </Text>
      {product.campaignName ? (
        <Text style={muted}>{product.campaignName}</Text>
      ) : null}
      <Text style={{ color: colors.accentSoft, marginTop: 4 }}>
        {formatMoney(price, product.currency)}
      </Text>
    </Pressable>
  );
}
