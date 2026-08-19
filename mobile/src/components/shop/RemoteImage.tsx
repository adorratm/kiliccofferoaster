import { useEffect, useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { productImage } from '../../lib/format';
import { stockProductFallback } from '../../lib/stock-images';
import { colors } from '../../ui';

export function RemoteImage({
  uri,
  seed,
  width,
  height,
  style,
}: {
  uri?: string | null;
  seed?: string;
  width?: number | `${number}%`;
  height: number;
  style?: StyleProp<ImageStyle>;
}) {
  const resolved = productImage(uri, seed);
  const [src, setSrc] = useState(resolved);

  useEffect(() => {
    setSrc(resolved);
  }, [resolved]);

  return (
    <Image
      source={{ uri: src }}
      resizeMode="cover"
      onError={() => {
        const fallback = stockProductFallback(seed || 'coffee');
        if (src !== fallback) setSrc(fallback);
      }}
      style={[
        {
          width: width ?? '100%',
          height,
          backgroundColor: colors.surfaceHigh,
        },
        style,
      ]}
    />
  );
}
